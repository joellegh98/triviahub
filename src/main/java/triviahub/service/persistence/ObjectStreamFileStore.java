package triviahub.service.persistence;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe ObjectStream read/write for list-backed {@code .ser} files.
 * Each filename has its own lock so concurrent requests cannot corrupt a file.
 */
@Component
public class ObjectStreamFileStore {

    private final Path baseDirectory;
    private final Map<String, Object> fileLocks = new ConcurrentHashMap<>();

    public ObjectStreamFileStore(
            @Value("${triviahub.persistence.directory:.}") String persistenceDirectory
    ) throws IOException {
        this.baseDirectory = Path.of(persistenceDirectory).toAbsolutePath().normalize();
        Files.createDirectories(this.baseDirectory);
    }

    /**
     * Returns the directory where {@code quizzes.ser}, {@code questions.ser}, and {@code results.ser} are stored.
     */
    public Path getBaseDirectory() {
        return baseDirectory;
    }

    /**
     * Reads a serialized list from the given file. Missing files yield an empty list.
     *
     * @param filename exact ser filename (e.g. {@link PersistencePaths#QUIZZES_FILE})
     * @param <T>      element type stored in the list
     * @return deserialized list, never null
     */
    @SuppressWarnings("unchecked")
    public <T> List<T> readList(String filename) {
        Object lock = lockFor(filename);
        synchronized (lock) {
            Path target = resolve(filename);
            if (!Files.exists(target)) {
                return new ArrayList<>();
            }
            try (ObjectInputStream input = new ObjectInputStream(Files.newInputStream(target))) {
                Object payload = input.readObject();
                if (payload instanceof List<?> list) {
                    return new ArrayList<>((List<T>) list);
                }
                throw new IOException("Expected List in " + target + " but found " + payload.getClass().getName());
            } catch (ClassNotFoundException e) {
                throw new IllegalStateException("Failed to deserialize " + target, e);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to read " + target, e);
            }
        }
    }

    /**
     * Writes a list to the given file, replacing any previous contents.
     *
     * @param filename exact ser filename
     * @param data     list to persist
     * @param <T>      element type
     */
    public <T> void writeList(String filename, List<T> data) {
        Object lock = lockFor(filename);
        synchronized (lock) {
            Path target = resolve(filename);
            Path temp = target.resolveSibling(target.getFileName() + ".tmp");
            try {
                try (ObjectOutputStream output = new ObjectOutputStream(Files.newOutputStream(temp))) {
                    output.writeObject(data != null ? data : List.of());
                }
                Files.move(temp, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                try {
                    Files.deleteIfExists(temp);
                } catch (IOException ignored) {
                    // best effort cleanup
                }
                throw new IllegalStateException("Failed to write " + target, e);
            }
        }
    }

    /**
     * Runs a read-modify-write cycle under the file lock so updates are atomic relative to other requests.
     *
     * @param filename exact ser filename
     * @param action   receives current list and returns the list to save
     * @param <T>      element type
     */
    public <T> void updateList(String filename, java.util.function.UnaryOperator<List<T>> action) {
        Object lock = lockFor(filename);
        synchronized (lock) {
            List<T> current = readListUnlocked(filename);
            List<T> updated = action.apply(current);
            writeListUnlocked(filename, updated);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> List<T> readListUnlocked(String filename) {
        Path target = resolve(filename);
        if (!Files.exists(target)) {
            return new ArrayList<>();
        }
        try (ObjectInputStream input = new ObjectInputStream(Files.newInputStream(target))) {
            Object payload = input.readObject();
            if (payload instanceof List<?> list) {
                return new ArrayList<>((List<T>) list);
            }
            throw new IOException("Expected List in " + target + " but found " + payload.getClass().getName());
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("Failed to deserialize " + target, e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read " + target, e);
        }
    }

    private <T> void writeListUnlocked(String filename, List<T> data) {
        Path target = resolve(filename);
        Path temp = target.resolveSibling(target.getFileName() + ".tmp");
        try {
            try (ObjectOutputStream output = new ObjectOutputStream(Files.newOutputStream(temp))) {
                output.writeObject(data != null ? data : List.of());
            }
            Files.move(temp, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            try {
                Files.deleteIfExists(temp);
            } catch (IOException ignored) {
                // best effort cleanup
            }
            throw new IllegalStateException("Failed to write " + target, e);
        }
    }

    private Path resolve(String filename) {
        return baseDirectory.resolve(filename);
    }

    private Object lockFor(String filename) {
        return fileLocks.computeIfAbsent(filename, ignored -> new Object());
    }
}
