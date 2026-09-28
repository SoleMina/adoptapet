package com.adoptapet.common.event;

/**
 * RabbitMQ names shared by every service. The routing key of each message is
 * "application." + event type in lower case, e.g. "application.approved".
 */
public final class EventTypes {

	public static final String EXCHANGE = "adoptapet.events";
	public static final String ROUTING_PREFIX = "application.";

	public static final String CREATED = "CREATED";
	public static final String APPROVED = "APPROVED";
	public static final String REJECTED = "REJECTED";
	public static final String NO_SHOW = "NO_SHOW";
	public static final String RESCHEDULED = "RESCHEDULED";
	public static final String CANCELLED = "CANCELLED";
	public static final String COMPLETED = "COMPLETED";

	private EventTypes() {
	}

	public static String routingKey(String type) {
		return ROUTING_PREFIX + type.toLowerCase();
	}
}
