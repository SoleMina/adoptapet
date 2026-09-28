package com.adoptapet.petservice.model;

public enum AdoptionStatus {
	/** Visible and open to adoption requests. */
	AVAILABLE,
	/** An adoption request was approved; waiting for delivery. */
	RESERVED,
	/** Adoption finished. */
	ADOPTED,
	/** Removed from the catalog (logical delete). */
	INACTIVE
}
