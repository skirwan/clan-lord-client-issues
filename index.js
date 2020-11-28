'use strict';

const fs = require('fs');
const GitHub = require('github-api');

const gh = new GitHub(
    { token: process.env['GH_KEY'] }
);

/*
const me = gh.getUser();
const iss = gh.getIssues('skirwan', 'clan-lord-client-issues');

(async function() {
    
    const issues = await iss.listIssues({}).data;

    console.log(issues);

    const createdResponse = await iss.createIssue({
        title: "Test Issue",
        body: "Body",
        labels: ["bug", "imported"]
    })

    console.log('Created:', created);
})().then(
    () => {
        console.log("Completed.");
    },
    err => {
        console.log("Something went wrong.", err);
        console.log(err.request);
    }
);
*/

const iss = gh.getIssues('skirwan', 'clan-lord-client-issues');

let files = fs.readdirSync('./export/bugs/')
let threads = []
let threadMap = {}
let fixedMap = {}

files.forEach(f => {
    let data = JSON.parse(fs.readFileSync('./export/bugs/' + f));

    if (Array.isArray(data)) {
        data.forEach(p => {
            // Child of a closed thread
            if (p.thread_ts && fixedMap[p.thread_ts]) {
                return;
            }

            let open = true

            if (!p.client_msg_id || !p.text) {
                // Bot notices, files

                open = false
            } else if (p.text.match(/^\<[^>]*\> has joined the channel$/)) {
                open = false;
            } else if (p.reactions && Array.isArray(p.reactions)) {
                p.reactions.forEach(r => {
                    if (r.name == 'fixed') {
                        open = false;
                        return;
                    }
                })
            }

            if (!open) {
                if (p.thread_ts) {
                    fixedMap[p.thread_ts] = true
                }
            } else {
                if (p.thread_ts) {
                    let thread = threadMap[p.thread_ts]
                    if (!thread) {
                        thread = {
                            posts: []
                        }
                        threadMap[p.thread_ts] = thread
                        threads.push(thread)
                    }

                    thread.posts.push(p);
                } else {
                    threads.push({
                        posts: [p]
                    });
                }
            }
        })
    }
});

function who(p) {
    if (p.user_profile) {
        return p.user_profile.display_name || p.user_profile.real_name || p.user_profile.name || 'UNKNOWN';
    }

    return 'UNKNOWN';
}

let importPromise = (async function () {
    for (let idx = 0; idx < threads.length; idx++) {
        let t = threads[idx];

        console.log(`Creating issue for message ${t.posts[0].client_msg_id}`)
        let ts = t.posts[0].ts.split('.').join('')

        let title = t.posts[0].text;
        
        if (title.length > 60) {
            title = title.substr(0, 59) + '…'
        }

        let lastPoster = who(t.posts[0]);
        let body = lastPoster + ': ';
        body += t.posts[0].text.replace('\n', '<br />');
        body += "<br /><br />" ;
        body += `https://clieunk.slack.com/archives/C018PCWS9T2/p${ts}`;

        for (let pidx = 1; pidx < t.posts.length; pidx++) {
            let p = t.posts[pidx];

            let thisPoster = who(p)

            if (thisPoster != lastPoster) {
                body += '<br /><br />' + thisPoster;
                lastPoster = thisPoster;
            }
            body += '<br /><br />' + p.text.replace('\n', '<br />')
        }

        // await iss.editIssue(idx + 9, { body: body} );
        // console.log(`Repaired issue #${idx + 9}`);

        let created = (await iss.createIssue({
            title: title,
            body: body,
            labels: ["bug", "imported"]
        })).data;

        console.log(`Created issue #${created.number}`);
    }
})()

importPromise.then(
    () => {
        console.log("Completed import!");
    },
    err => {
        console.log("Something went wrong:", err);
    }
);