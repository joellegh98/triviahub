package triviahub.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import triviahub.dto.ErrorResponse;
import triviahub.exception.DuplicateResourceException;
import triviahub.exception.ResourceNotFoundException;
import triviahub.exception.ValidationException;

/**
 * Maps domain exceptions to HTTP status codes and JSON error bodies.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles missing quiz, question, or related resources.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Handles duplicate quiz title conflicts.
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Handles validation failures with optional per-field messages.
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse body = ex.getFieldErrors().isEmpty()
                ? new ErrorResponse(ex.getMessage())
                : new ErrorResponse(ex.getMessage(), ex.getFieldErrors());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
