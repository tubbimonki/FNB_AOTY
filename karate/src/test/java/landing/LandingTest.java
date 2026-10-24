package landing;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

// JUnit's only job here is to start Karate. Karate finds every .feature file
// under classpath:landing, runs it, and writes an HTML report to
// target/karate-reports/karate-summary.html.
//
// One thread (parallel(1)) because all the UI features share one Chrome window.
// Pick a subset with tags, e.g.  mvn test -Dkarate.options="--tags @api"
class LandingTest {

    @Test
    void landingPage() {
        Results results = Runner.path("classpath:landing")
                .tags("~@ignore")
                .outputCucumberJson(true)
                .parallel(1);
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
