import { createRequire } from "module";
const require = createRequire(import.meta.url);
const nextConfigs = require("eslint-config-next");

const eslintConfig = [...nextConfigs];

export default eslintConfig;
