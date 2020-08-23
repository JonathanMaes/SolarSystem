let Settings = {
    DRAW_ORBITS: false,
}

function toggle(setting, value=undefined) {
    setting = setting.toUpperCase();
    if (value === undefined) {
        if (typeof Settings[setting] === "boolean") {
            Settings[setting] = !Settings[setting]
        } else {
            throw `Can not toggle non-boolean setting '${setting}'. Please provide a value to set: toggle('${setting}', value).`
        }
    } else {
        if (typeof Settings[setting] === typeof value) {
            Settings[setting] = value;
        } else {
            throw `Type of setting '${setting}' is '${typeof Settings[setting]}', but '${typeof value}' was given.`
        }
    }
}

function get(setting) {
    setting = setting.toUpperCase();
    return Settings[setting]
}


export {toggle, get}