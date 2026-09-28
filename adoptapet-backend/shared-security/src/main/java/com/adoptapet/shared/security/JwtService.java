package com.adoptapet.shared.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	@Value("${jwt.secret}")
	private String secret;

	@Value("${jwt.expiration:3600000}")
	private Long expiration;

	public String generateToken(Long userId, String username, String role) {
		return Jwts.builder()
				.subject(username)
				.claim("id", userId)
				.claim("role", role)
				.issuedAt(new Date())
				.expiration(new Date(System.currentTimeMillis() + expiration))
				.signWith(getKey())
				.compact();
	}

	public AuthUser parseToken(String token) {
		Claims claims = Jwts.parser()
				.verifyWith(getKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();

		return new AuthUser(claims.get("id", Long.class), claims.getSubject(), claims.get("role", String.class));
	}

	public Long getExpiration() {
		return expiration;
	}

	private SecretKey getKey() {
		return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
	}
}
