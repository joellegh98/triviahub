package triviahub.exception;

/**
 * Thrown when creating or updating would violate a uniqueness constraint.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
