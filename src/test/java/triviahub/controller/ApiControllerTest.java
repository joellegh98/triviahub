package triviahub.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import triviahub.init.DataInit;

import java.nio.file.Path;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiControllerTest {

    @TempDir
    static Path tempDir;

    @DynamicPropertySource
    static void persistenceProperties(DynamicPropertyRegistry registry) {
        registry.add("triviahub.persistence.directory", () -> tempDir.toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void seedData() throws Exception {
        DataInit.main(new String[]{tempDir.toString()});
    }

    @Test
    void listQuizzesIncludesQuestionCount() throws Exception {
        mockMvc.perform(get("/api/quizzes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].questionCount", greaterThanOrEqualTo(5)));
    }

    @Test
    void createQuizDuplicateTitleReturns409() throws Exception {
        String body = """
                {"title":"javascript fundamentals","category":"programming","description":"dup"}
                """;
        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void createAndDeleteQuiz() throws Exception {
        String createBody = """
                {"title":"new quiz","category":"science","description":"test"}
                """;
        String response = mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("new quiz"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = response.replaceAll(".*\"id\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        mockMvc.perform(delete("/api/quizzes/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/quizzes/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void randomQuestionsEndpointReturnsShuffledList() throws Exception {
        String listResponse = mockMvc.perform(get("/api/quizzes"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String quizId = listResponse.replaceAll(".*\"id\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/quizzes/" + quizId + "/questions/random"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)));
    }

    @Test
    void saveResultAndReadLeaderboards() throws Exception {
        String listResponse = mockMvc.perform(get("/api/quizzes"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String quizId = listResponse.replaceAll(".*\"id\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        String resultBody = """
                {
                  "quizId":"%s",
                  "playerName":"Tester",
                  "score":80,
                  "correctAnswers":4,
                  "totalQuestions":5,
                  "durationSec":90,
                  "hintsUsed":1,
                  "playedAt":"2026-05-19T12:00:00Z"
                }
                """.formatted(quizId);

        mockMvc.perform(post("/api/results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resultBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(80));

        mockMvc.perform(get("/api/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/quizzes/" + quizId + "/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void deleteQuizRemovesItsQuestions() throws Exception {
        String createBody = """
                {"title":"temp quiz","category":"science","description":"cascade test"}
                """;
        String response = mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String quizId = response.replaceAll(".*\"id\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        String questionBody = """
                {"text":"Sample?","options":["a","b","c","d"],"correctIndex":1,"hint":"hint"}
                """;
        mockMvc.perform(post("/api/quizzes/" + quizId + "/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionBody))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/quizzes/" + quizId + "/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(delete("/api/quizzes/" + quizId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/quizzes/" + quizId + "/questions"))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidQuestionReturns400() throws Exception {
        String listResponse = mockMvc.perform(get("/api/quizzes"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String quizId = listResponse.replaceAll(".*\"id\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        String body = """
                {"text":"","options":["a","b","c","d"],"correctIndex":0,"hint":"h"}
                """;
        mockMvc.perform(post("/api/quizzes/" + quizId + "/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }
}
