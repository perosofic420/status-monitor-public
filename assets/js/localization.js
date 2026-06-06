function formText(str, vars = {}) {//todo: put in localization.js
    for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}