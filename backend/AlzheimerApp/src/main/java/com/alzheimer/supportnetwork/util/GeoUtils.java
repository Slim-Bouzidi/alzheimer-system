package com.alzheimer.supportnetwork.util;

/**
 * Geographic helpers for proximity scoring (Haversine great-circle distance) and WGS84 validation.
 */
public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {}

    /**
     * Haversine distance between two WGS84 points in kilometers.
     */
    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1.0 - a)));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * True when both coordinates are present and within WGS84 ranges (finite, not NaN).
     */
    public static boolean isValidWgs84(Double lat, Double lon) {
        if (lat == null || lon == null) {
            return false;
        }
        if (Double.isNaN(lat) || Double.isNaN(lon) || Double.isInfinite(lat) || Double.isInfinite(lon)) {
            return false;
        }
        return lat >= -90.0 && lat <= 90.0 && lon >= -180.0 && lon <= 180.0;
    }

    /**
     * Validates optional stored coordinates: both null/empty is allowed; otherwise both must be set and valid.
     *
     * @throws IllegalArgumentException if only one of lat/lon is set, or ranges are invalid
     */
    public static void validateOptionalCoordinates(Double latitude, Double longitude) {
        boolean latPresent = latitude != null;
        boolean lonPresent = longitude != null;
        if (!latPresent && !lonPresent) {
            return;
        }
        if (latPresent != lonPresent) {
            throw new IllegalArgumentException("Latitude and longitude must both be provided, or both omitted.");
        }
        if (!isValidWgs84(latitude, longitude)) {
            throw new IllegalArgumentException(
                    "Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180.");
        }
    }
}
