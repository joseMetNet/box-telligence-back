import i18n from "i18n"

i18n.configure({
  locales: ["en", "es"], // List of supported languages
  directory: __dirname + "/locales", // Directory where translation files are located
  defaultLocale: "en", // Default language if none is specified
  queryParameter: "lang", // Parameter to set the language (e.g., /page?lang=en)
  register: global, // Register __() as a global variable
  objectNotation: true, // Access translations using object notation (e.g., __("messages.welcome"))
});

export default i18n