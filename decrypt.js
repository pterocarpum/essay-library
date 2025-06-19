function dtc(c, t) {
    const a = [
        'M', 'o', 'q', '8', 'K', 'g', '[', '6', '-', 'G', 'B', '.', '^', '5', 'z', 'C', 'x', '$', 'J', 'm', 'k', 'F', 'h',
        '<', '9', '%', 'e', 'Y', 'W', 'S', '+', "'", 'R', '#', 'T', 'a', ':', '\n', '2', '&', '\\', 'n', 'i', 'X', '3',
        '@', 'V', 's', 'E', '!', '`', 'b', '\x0b', ')', 'v', 'j', '4', '~', '/', 'u', 'd', 'H', 't', '*', 'A', 'N', 'p',
        ',', '7', '\r', 'w', 'f', '_', 'D', '?', ']', '\t', '1', 'Q', '=', 'L', '|', '}', '0', 'r', 'I', 'U', ' ', '>',
        ';', 'P', '\x0c', '{', '"', 'c', 'O', 'Z', 'y', '(', 'l'
    ];
    const n = a.length;
    const r = [];

    const e = Array.from(t).filter(char => a.includes(char)).join('');
    const d = e.length;
    let i = 0;

    for (let s = 0; s < c.length; s++) {
        const o = c[s];

        if (a.includes(o)) {
            const f = a.indexOf(o);
            const u = e[i % d];
            const h = a.indexOf(u);
            const x = (f - h + n) % n;
            r.push(a[x]);
            i++;
        } else {
            r.push(o);
        }
    }

    return r.join('');
}

function predeterminedScramble(word) {
    let scrambled = word.split('').reverse();

    const printableChars = [
        '6', '`', 'o', '[', 'h', '*', 'i', '&', '+', 'U', 'a', 'E', 'C', 'N', '#', 'w', ']', 'l', '<', 'I', 'c', 'A', '4',
        'n', ')', '9', '(', '>', 'M', '7', '3', 'm', 'Q', 'J', 'D', 'O', "'", ':', 'T', 'd', 'L', '?', 'S', 'R', '_', 'Y',
        '2', '|', '"', 'q', 'X', 'e', '.', 's', 'r', 'u', 'j', ';', '}', 'P', ' ', 'v', 'W', '^', '8', 'V', 't', 'f', 'z',
        'g', '@', 'x', '!', 'H', 'y', '$', '=', '1', '%', 'k', '-', 'B', '0', '\\', 'b', '~', 'Z', 'K', 'p', 'F', 'G',
        '{', '5', '/', ','
    ];

    for (let i = 0; i < scrambled.length; i++) {
        let ch = scrambled[i];
        let idx = printableChars.indexOf(ch);
        if (idx === -1) idx = 0;

        scrambled[i] = (i % 2 === 0)
            ? printableChars[(idx + 1) % printableChars.length]
            : printableChars[(idx - 1 + printableChars.length) % printableChars.length];
    }

    for (let i = 0; i < scrambled.length - 1; i += 2) {
        [scrambled[i], scrambled[i + 1]] = [scrambled[i + 1], scrambled[i]];
    }

    return scrambled.join('');
}