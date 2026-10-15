package com.adoptapet.petservice.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Optional reason given when deactivating. Kept until the record is activated again. */
@Data
public class DeactivateRequest {

	@Size(max = 500)
	private String reason;
}
