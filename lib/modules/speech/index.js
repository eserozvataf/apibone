const https = require('https'),
    fs = require('fs'),
    stream = require('stream'),
    tmp = require('tmp'),
    config = require('../../../config.js');

function speechCommand(argv, session) {
    return new Promise((resolve, reject) => {
        const input = encodeURIComponent(argv._.slice(1).join(' ')),
            lang = argv.lang || 'tr';

        const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&client=tw-ob&q=${input}&tl=${lang}`;

        https.get(streamUrl, (res) => {
            tmp.file({ prefix: input, postfix: '.mp3' }, (err, fileToWrite, fd, cleanup) => {
                if (err) {
                    reject(err);
                    return;
                }

                const streamToWrite = fs.createWriteStream(fileToWrite);

                res.pipe(streamToWrite);
                streamToWrite.on('finish', () => {
                    streamToWrite.close(() => {
                        resolve({
                            response: {
                                filename: `${input}.mp3`,
                                contentType: 'audio/mpeg',
                                audioFile: fileToWrite,
                                sourceUrl: streamUrl
                            },
                            formatPlain: (result) => { session.sendAudio(result); },
                            formatMarkdown: (result) => { session.sendAudio(result); },
                            formatJson: (result) => { session.sendAudio(result); }
                        });

                        session.events.on('end', cleanup);
                    });
                });
            });
        });
    });
}

apiBone.addCommand({
    command: 'speech',
    description: 'Text-to-speech',
    usage: 'speech free speech',
    demandArgs: 1,
    demandOptions: [ ],
    callback: speechCommand
});
