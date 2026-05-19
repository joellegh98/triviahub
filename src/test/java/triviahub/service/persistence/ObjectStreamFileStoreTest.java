package triviahub.service.persistence;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import triviahub.model.Quiz;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ObjectStreamFileStoreTest {

    @TempDir
    Path tempDir;

    @Test
    void readListReturnsEmptyWhenFileMissing() throws Exception {
        ObjectStreamFileStore store = new ObjectStreamFileStore(tempDir.toString());
        assertTrue(store.readList(PersistencePaths.QUIZZES_FILE).isEmpty());
    }

    @Test
    void writeAndReadRoundTrip() throws Exception {
        ObjectStreamFileStore store = new ObjectStreamFileStore(tempDir.toString());
        List<Quiz> quizzes = List.of(
                new Quiz("id-1", "Title One", "science", "Desc"),
                new Quiz("id-2", "Title Two", "history", "Desc 2")
        );
        store.writeList(PersistencePaths.QUIZZES_FILE, quizzes);

        List<Quiz> loaded = store.readList(PersistencePaths.QUIZZES_FILE);
        assertEquals(2, loaded.size());
        assertEquals("id-1", loaded.get(0).getId());
        assertEquals("Title Two", loaded.get(1).getTitle());
    }

    @Test
    void concurrentUpdatesPreserveAllEntries() throws Exception {
        ObjectStreamFileStore store = new ObjectStreamFileStore(tempDir.toString());
        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            int index = i;
            executor.submit(() -> {
                try {
                    start.await();
                    store.updateList(PersistencePaths.QUIZZES_FILE, current -> {
                        List<Quiz> updated = new ArrayList<>(current);
                        updated.add(new Quiz("id-" + index, "Quiz " + index, "cat", "d"));
                        return updated;
                    });
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();
        assertTrue(done.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(threadCount, store.readList(PersistencePaths.QUIZZES_FILE).size());
    }

    @Test
    void usesExactSerFilenames() throws Exception {
        ObjectStreamFileStore store = new ObjectStreamFileStore(tempDir.toString());
        store.writeList(PersistencePaths.QUIZZES_FILE, List.of());
        store.writeList(PersistencePaths.QUESTIONS_FILE, List.of());
        store.writeList(PersistencePaths.RESULTS_FILE, List.of());

        assertTrue(java.nio.file.Files.exists(tempDir.resolve(PersistencePaths.QUIZZES_FILE)));
        assertTrue(java.nio.file.Files.exists(tempDir.resolve(PersistencePaths.QUESTIONS_FILE)));
        assertTrue(java.nio.file.Files.exists(tempDir.resolve(PersistencePaths.RESULTS_FILE)));
    }
}
