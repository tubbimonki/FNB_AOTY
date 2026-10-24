// Karate runs this once before every scenario. Whatever it returns becomes
// variables every feature can use (baseUrl, apiUrl, ...).
//
// Override any of them from the command line, e.g.
//   mvn test -DbaseUrl=http://localhost:5174 -Dheadless=false
function fn() {
  var prop = function (name, fallback) {
    var value = karate.properties[name];
    return value ? value : fallback;
  };

  var config = {
    // The Vite dev server (npm run dev). It forwards /api/* to Express.
    baseUrl: prop('baseUrl', 'http://localhost:5173'),
    // The Express server itself (npm run api), for direct API checks.
    apiUrl: prop('apiUrl', 'http://localhost:4000/api'),
    // Screen sizes used by the responsive tests. lg in Tailwind is 1024px.
    // emulateDevice(width, height, userAgent) makes Chrome act like that screen.
    phone: {
      width: 390, height: 844,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    desktop: {
      width: 1280, height: 900,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
    }
  };

  // Karate UI drives a real Chrome over the DevTools protocol. On Windows and
  // macOS it finds Chrome by itself; -DchromePath=... points it elsewhere.
  var driver = {
    type: 'chrome',
    headless: prop('headless', 'true') == 'true',
    showDriverLog: false,
    addOptions: ['--no-sandbox', '--disable-gpu', '--window-size=1280,900']
  };
  // Keep Chrome's throwaway profile in the system temp folder, not in
  // karate/target, so it never sits inside the folder Vite is watching.
  driver.userDataDir = java.lang.System.getProperty('java.io.tmpdir') + '/karate-chrome';
  var chromePath = prop('chromePath', null);
  if (chromePath) driver.executable = chromePath;
  karate.configure('driver', driver);

  // Fail fast instead of waiting the default 30s when something is missing.
  karate.configure('retry', { count: 10, interval: 300 });

  return config;
}
