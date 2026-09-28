package com.adoptapet.adoptionservice.service;

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

import com.adoptapet.common.exception.ApiException;

/**
 * Private documents (DNI, proof of address, acts). They are only returned through the API after
 * a permission check; the folder is never exposed as static content.
 */
@Service
public class DocumentStorageService {

	private static final Map<String, String> ALLOWED_TYPES = Map.of(
			"application/pdf", ".pdf",
			"image/jpeg", ".jpg",
			"image/png", ".png");

	private final Path folder;

	public DocumentStorageService(@Value("${app.storage.documents}") String folder) {
		this.folder = Paths.get(folder).toAbsolutePath().normalize();
	}

	public String save(MultipartFile file, String prefix) {
		if (file == null || file.isEmpty()) {
			throw ApiException.badRequest("The file is required");
		}
		String extension = ALLOWED_TYPES.get(file.getContentType());
		if (extension == null) {
			throw ApiException.badRequest("Only PDF, JPG or PNG files are allowed");
		}

		String fileName = prefix + "_" + UUID.randomUUID() + extension;
		try (InputStream input = file.getInputStream()) {
			Files.createDirectories(folder);
			Files.copy(input, folder.resolve(fileName));
		} catch (IOException e) {
			throw new IllegalStateException("Could not save the document", e);
		}
		return fileName;
	}

	public String save(byte[] content, String fileName) {
		try {
			Files.createDirectories(folder);
			Files.write(folder.resolve(fileName), content);
		} catch (IOException e) {
			throw new IllegalStateException("Could not save the document", e);
		}
		return fileName;
	}

	public Resource load(String fileName) {
		if (fileName == null) {
			throw ApiException.notFound("Document not found");
		}
		Path file = folder.resolve(fileName).normalize();
		if (!file.startsWith(folder) || !Files.isRegularFile(file)) {
			throw ApiException.notFound("Document not found");
		}
		return new PathResource(file);
	}
}
