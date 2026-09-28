package com.adoptapet.adoptionservice.model;

/**
 * PENDING -> APPROVED -> COMPLETED
 *         -> REJECTED   APPROVED -> NO_SHOW -> (reschedule) APPROVED
 *                       APPROVED | NO_SHOW -> CANCELLED
 */
public enum ApplicationStatus {
	PENDING,
	APPROVED,
	REJECTED,
	NO_SHOW,
	COMPLETED,
	CANCELLED
}
