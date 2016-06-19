const path = require('path'),
    fs = require('fs'),
    yargsParser = require('yargs-parser'),
    StringUtils = require('./utils/StringUtils.js');

class ApiBone {
    constructor(platformType) {
        this.platform = new platformType(this);
    }

    execute(options) {
        const argv = yargsParser(options.args),
            cmd = argv._.shift();

        try {
            fs.accessSync(path.join(__dirname, `modules/${cmd}/index.js`), fs.F_OK);
        }
        catch (ex) {
            throw new Error(`${cmd} is not a registered module.`);
        }

        const moduleType = require(`./modules/${cmd}/`),
            moduleInstance = new moduleType();

        const formatter = argv.format || this.platform.defaultFormatter,
            method = `view${StringUtils.capitalize(formatter)}`;

        if (argv.format !== undefined) {
            delete argv.format;
        }

        const session = this.platform.createSession(formatter, options);

        try {
            if (moduleInstance[method] === undefined) {
                throw new Error(`${method} is not defined in ${cmd} module.`);
            }

            return moduleInstance[method](argv, session)
                .then(() => {
                    session.end();
                })
                .catch((ex) => {
                    session.error(ex);
                });
        }
        catch (ex) {
            session.error(ex);
        }
    }
}

module.exports = ApiBone;
