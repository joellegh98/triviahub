package triviahub.exception;

import java.util.Map;

/**
 * Thrown when request data fails business validation rules.
 */
public class ValidationException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public ValidationException(String message) {
        super(message);
        this.fieldErrors = Map.of();
    }

    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors != null ? Map.copyOf(fieldErrors) : Map.of();
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
