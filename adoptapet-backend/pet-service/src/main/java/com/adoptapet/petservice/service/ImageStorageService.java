package com.adoptapet.petservice.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.adoptapet.shared.exception.ApiException;

import lombok.extern.slf4j.Slf4j;

/** Stores pet photos on disk. Files get a random name, never the name sent by the client. */
@Slf4j
@Service
public class ImageStorageService {

	private static final Map<String, String> ALLOWED_TYPES = Map.of(
			"image/jpeg", ".jpg",
			"image/png", ".png",
			"image/webp", ".webp");

	private final Path folder;

	public ImageStorageService(@Value("${app.storage.pet-images}") String folder) {
		this.folder = Paths.get(folder).toAbsolutePath().normalize();
	}

	public String save(MultipartFile file) {
		String extension = ALLOWED_TYPES.get(file.getContentType());
		if (extension == null) {
			throw ApiException.badRequest("Only JPG, PNG or WEBP images are allowed");
		}

		String fileName = UUID.randomUUID() + extension;
		try (InputStream input = file.getInputStream()) {
			Files.createDirectories(folder);
			Files.copy(input, folder.resolve(fileName));
		} catch (IOException e) {
			throw new IllegalStateException("Could not save the image", e);
		}
		return fileName;
	}

	public Resource load(String fileName) {
		Path file = folder.resolve(fileName).normalize();
		if (!file.startsWith(folder) || !Files.isRegularFile(file)) {
			throw ApiException.notFound("Image not found");
		}
		return new PathResource(file);
	}

	public void delete(String fileName) {
		if (fileName == null) {
			return;
		}
		try {
			Files.deleteIfExists(folder.resolve(fileName).normalize());
		} catch (IOException e) {
			log.warn("Could not delete old image {}", fileName, e);
		}
	}
}
