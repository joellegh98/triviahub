package triviahub.init;

import triviahub.model.Question;
import triviahub.model.Quiz;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Standalone utility that seeds {@code quizzes.ser}, {@code questions.ser}, and {@code results.ser}.
 * <p>
 * Run from the repository root (or pass a target directory as the first argument):
 * {@code mvn -q exec:java -Dexec.mainClass=triviahub.init.DataInit}
 */
public final class DataInit {

    private DataInit() {
    }

    public static void main(String[] args) throws IOException {
        String directory = args.length > 0 ? args[0] : ".";
        ObjectStreamFileStore store = new ObjectStreamFileStore(directory);

        List<Quiz> quizzes = buildQuizzes();
        List<Question> questions = buildQuestions(quizzes);

        store.writeList(PersistencePaths.QUIZZES_FILE, quizzes);
        store.writeList(PersistencePaths.QUESTIONS_FILE, questions);
        store.writeList(PersistencePaths.RESULTS_FILE, List.of());

        System.out.println("DataInit wrote to: " + store.getBaseDirectory());
        System.out.println("  " + quizzes.size() + " quizzes");
        System.out.println("  " + questions.size() + " questions");
        System.out.println("  0 game results");
    }

    private static List<Quiz> buildQuizzes() {
        List<Quiz> quizzes = new ArrayList<>();
        quizzes.add(new Quiz(
                UUID.randomUUID().toString(),
                "javascript fundamentals",
                "programming",
                "Variables, arrays, functions, and core JS behavior."
        ));
        quizzes.add(new Quiz(
                UUID.randomUUID().toString(),
                "world geography",
                "geography",
                "Countries, capitals, landmarks, and world regions."
        ));
        quizzes.add(new Quiz(
                UUID.randomUUID().toString(),
                "general science",
                "science",
                "Physics, chemistry, biology, and earth science basics."
        ));
        return quizzes;
    }

    private static List<Question> buildQuestions(List<Quiz> quizzes) {
        String jsQuizId = findQuizId(quizzes, "javascript fundamentals");
        String geoQuizId = findQuizId(quizzes, "world geography");
        String sciQuizId = findQuizId(quizzes, "general science");

        List<Question> questions = new ArrayList<>();

        questions.add(new Question(
                UUID.randomUUID().toString(),
                jsQuizId,
                "Which keyword declares a block-scoped variable?",
                List.of("var", "let", "const", "both let and const"),
                3,
                "Think about ES6 declarations.",
                "easy"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                jsQuizId,
                "What does Array.prototype.map return?",
                List.of(
                        "A filtered array",
                        "A new transformed array",
                        "The same original array",
                        "A single value"
                ),
                1,
                "It keeps the same length as original.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                jsQuizId,
                "Which value is strictly equal to itself?",
                List.of("NaN", "undefined", "null", "0"),
                3,
                "NaN is a famous exception.",
                "hard"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                jsQuizId,
                "What is the output type of JSON.parse?",
                List.of("string", "number", "javascript value/object", "boolean only"),
                2,
                "It recreates native structures from JSON.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                jsQuizId,
                "Which method adds an item to the end of an array?",
                List.of("shift", "push", "unshift", "concat"),
                1,
                "Its opposite is pop.",
                "easy"
        ));

        questions.add(new Question(
                UUID.randomUUID().toString(),
                geoQuizId,
                "What is the capital city of Canada?",
                List.of("Toronto", "Vancouver", "Ottawa", "Montreal"),
                2,
                "It is in Ontario but not Toronto.",
                "easy"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                geoQuizId,
                "Which desert is the largest hot desert in the world?",
                List.of("Gobi", "Sahara", "Kalahari", "Arabian"),
                1,
                "It spans North Africa.",
                "easy"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                geoQuizId,
                "The Andes mountain range is mainly on which continent?",
                List.of("Asia", "Europe", "South America", "Africa"),
                2,
                "Think of Chile and Peru.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                geoQuizId,
                "Which country has the largest land area?",
                List.of("Canada", "China", "United States", "Russia"),
                3,
                "It stretches across Europe and Asia.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                geoQuizId,
                "Which river flows through Egypt into the Mediterranean Sea?",
                List.of("Amazon", "Nile", "Danube", "Volga"),
                1,
                "Often called the longest river in the world.",
                "easy"
        ));

        questions.add(new Question(
                UUID.randomUUID().toString(),
                sciQuizId,
                "What is the chemical symbol for gold?",
                List.of("Gd", "Ag", "Au", "Go"),
                2,
                "It comes from the Latin word aurum.",
                "easy"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                sciQuizId,
                "Which planet is known as the Red Planet?",
                List.of("Venus", "Mars", "Jupiter", "Mercury"),
                1,
                "Its color comes from iron oxide.",
                "easy"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                sciQuizId,
                "What is the process by which plants make food?",
                List.of("Respiration", "Digestion", "Photosynthesis", "Fermentation"),
                2,
                "It needs sunlight, water, and carbon dioxide.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                sciQuizId,
                "What force keeps planets in orbit around the sun?",
                List.of("Magnetism", "Friction", "Electricity", "Gravity"),
                3,
                "It is proportional to mass.",
                "medium"
        ));
        questions.add(new Question(
                UUID.randomUUID().toString(),
                sciQuizId,
                "Which gas do humans mainly inhale for survival?",
                List.of("Nitrogen", "Carbon dioxide", "Oxygen", "Hydrogen"),
                2,
                "It is about 21% of Earth atmosphere.",
                "hard"
        ));

        return questions;
    }

    private static String findQuizId(List<Quiz> quizzes, String title) {
        return quizzes.stream()
                .filter(quiz -> title.equals(quiz.getTitle()))
                .map(Quiz::getId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing quiz: " + title));
    }
}
