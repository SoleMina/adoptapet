# Deploy on Oracle Cloud (Always Free ARM server)

The whole stack (6 Spring Boot services, MySQL, RabbitMQ and the Angular app) runs on one Always Free Ampere A1
server with the same `docker-compose.yml` used locally, plus `docker-compose.prod.yml`. Only Caddy is public: it
serves `https://<DOMAIN>` with a free Let's Encrypt certificate.

```
Internet ──443──> caddy ──> frontend (nginx) ──/api──> api-gateway ──> services ──> mysql, rabbitmq
                              └── Angular app
```

* Web: `https://<DOMAIN>`
* API for the iOS app: `https://<DOMAIN>/api` (iOS blocks plain HTTP, so HTTPS is required)

## 1. Create the server

1. Sign up at [cloud.oracle.com/free](https://cloud.oracle.com/free). A card is asked to verify identity; Always
   Free resources are not charged. The **home region cannot be changed later**: from Peru, São Paulo or Santiago are
   the closest.
2. **Compute > Instances > Create instance**:
   * Image: **Canonical Ubuntu 24.04** (the aarch64 build is picked automatically with the shape below).
   * Shape: **Ampere > VM.Standard.A1.Flex**, as many OCPUs and GB as the free tier allows (2 OCPU / 12 GB is enough).
   * Networking: create a VCN with a public subnet and keep **Assign a public IPv4 address** on.
   * SSH keys: **Save private key** (download it) or paste your own public key.
   * Boot volume: 50 GB or more (up to 200 GB total is free).
   * "Out of capacity" means the region has no free ARM servers right now: try another availability domain or retry
     later.
   * Optional shortcut: **Advanced options > Management > Paste cloud-init script** with the content of
     [cloud-init.sh](cloud-init.sh). It does steps 2.2 to 5 by itself on first boot (only the security list rules of
     step 2.1 are still manual); follow it with `sudo tail -f /var/log/cloud-init-output.log`.
3. Copy the instance's **public IP**.

## 2. Open ports 80 and 443

Both are needed: Oracle's network firewall and the server's own iptables.

1. Instance > **Subnet > Security list > Add ingress rules**: source `0.0.0.0/0`, TCP, destination port `80`; another
   one for `443`.
2. Inside the server (step 3) run:

   ```sh
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

## 3. Install Docker and get the code

```sh
chmod 600 ~/Downloads/ssh-key.key                    # the key downloaded in step 1
ssh -i ~/Downloads/ssh-key.key ubuntu@<PUBLIC_IP>

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit              # log in again so docker works without sudo

ssh -i ~/Downloads/ssh-key.key ubuntu@<PUBLIC_IP>
git clone <repo URL> adoptapet && cd adoptapet       # private repo: use a GitHub token or a deploy key
```

## 4. Configure

```sh
cp deploy/.env.example .env                          # DOMAIN and internal passwords
cp adoptapet-backend/.env.example adoptapet-backend/.env
openssl rand -hex 64                                 # paste as JWT_SECRET in adoptapet-backend/.env
nano .env && nano adoptapet-backend/.env
```

* `DOMAIN`: without a domain use the IP with dashes plus `.sslip.io` (`129.146.10.20` → `129-146-10-20.sslip.io`).
  Any other name (DuckDNS, your own domain) works if its DNS points to the public IP.
* `MYSQL_ROOT_PASSWORD` is applied only when the database is created. Changing it later requires changing it inside
  MySQL too.

## 5. Start

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The first build takes 10 to 20 minutes on ARM. Give Eureka ~30 seconds after the services start, then open
`https://<DOMAIN>` and `https://<DOMAIN>/api/pets`. Status and logs:

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy api-gateway
```

## Update after a push

```sh
cd ~/adoptapet && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Never use `down -v` on the server: it deletes the database. Backup:

```sh
docker compose exec mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases' > backup.sql
```

## Notes

* The example users of `adoptapet-backend/database/test-users.sql` (`admin.test`, `worker.test`, password `secreto123`)
  are public in the repo. Fine for the course demo; change their passwords before loading real data.
* Uploaded photos and documents stay in `adoptapet-backend/uploads/` on the server's disk.
* Oracle may reclaim Always Free instances that stay almost idle for 7 days. Upgrading the account to Pay As You Go
  avoids it and still costs nothing within the free limits.
