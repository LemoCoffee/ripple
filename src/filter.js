// Common letter substitutions
const substitutions = {
    a: /[aA@4αΑа]/u,
    b: /[bB8βВв]/u,
    c: /[cCçćčс]/u,
    d: /[dDđ]/u,
    e: /[eE3€εєе]/u,
    f: /[fFƒ4]/u,
    g: /[gG69]/u,
    h: /[hH]/u,
    i: /[iI1!|íìîïιі]/u,
    j: /[jJ]/u,
    k: /[kKκк]/u,
    l: /[lL1|ł]/u,
    m: /[mM]/u,
    n: /[nNñÑн]/u,
    o: /[oO0öóòôοОо]/u,
    p: /[pPρр]/u,
    q: /[qQ9]/u,
    r: /[rR]/u,
    s: /[sS$5šśѕ]/u,
    t: /[tT7+τт]/u,
    u: /[uUυу]/u,
    v: /[vVνв]/u,
    w: /[wWω]/u,
    x: /[xXχх]/u,
    y: /[yY¥]/u,
    z: /[zZ2žźз]/u
};

const wordList = [
    "kil yourself",
    "tranies",
    "retard",
    "fagot",
    "trany",
    "negro",
    "niger",
    "chink",
    "honky",
    "spic",
    "niga",
    "gook",
    "kike",
    "dyke",
    "fgt",
    "fag",
    "kys"
];

const exemptWords = [
    "jacksepticeye",
    "inconspicuous",
    "shenanigans",
    "philosophical",
    "underground",
    "especially",
    "satisfies",
    "flatgrass",
    "minigame",
    "fragment",
    "bouncing",
    "yourself",
    "thinking",
    "bonding",
    "finding",
    "longing",
    "running",
    "getting",
    "spooky",
    "spice",
    "pitch",
    "fight",
    "spicy",
    "funni",
    "flag",
    "kick",
    "half",
    "frag",
    "game",
    "join",
    "pick",
    "keys",
    "get",
    "good",
    "ago",
    "sky",
    "vs"
];

function removeRepeatedChars(text) {
    let result = "";
    const mapping = [];
    let prev = "";

    const chars = Array.from(text);

    chars.forEach((char, i) => {
        if (char !== prev) {
            result += char;
            mapping.push(i);
        }
        prev = char;
    });

    return { result, mapping };
}

const maxGap = 1;

function fuzzyMatchFrom(text, target, pos, branchStart = null, lastMatchEnd = null) {
    if (target.length === 0)
        return {
            found: true,
            start: branchStart,
            end: lastMatchEnd
        };

    const pattern = substitutions[target[0]] ?? new RegExp(target[0], "u");

    for (let i = pos; i < text.length; i++) {
        const ch = text[i];

        if (!pattern.test(ch))
            continue;

        if (lastMatchEnd !== null && i - lastMatchEnd - 1 > maxGap)
            continue;

        const res = fuzzyMatchFrom(
            text,
            target.slice(1),
            i + 1,
            branchStart ?? i,
            i
        );

        if (res.found)
            return res;
    }

    return { found: false };
}

function fuzzyMatch(text, target) {
    const { result, mapping } = removeRepeatedChars(text);

    const res = fuzzyMatchFrom(result, target, 0);

    if (!res.found)
        return { found: false };

    return {
        found: true,
        start: mapping[res.start],
        end: mapping[res.end]
    };
}

function isMostlyCyrillic(text) {
    let total = 0;
    let cyrillic = 0;

    for (const char of text) {
        if (!/[A-Za-zА-Яа-яЁё]/u.test(char))
            continue;

        total++;

        if (/[А-Яа-яЁё]/u.test(char))
            cyrillic++;
    }

    return total > 0 && cyrillic / total > 0.5;
}

function getMatchedWord(text, start, end) {
    while (start > 0 && /\p{L}/u.test(text[start - 1]))
        start--;

    while (end < text.length - 1 && /\p{L}/u.test(text[end + 1]))
        end++;

    return text.slice(start, end + 1);
}

export function isOffensive(text) {
    text = text.toLowerCase();

    if (isMostlyCyrillic(text))
        return false;

    for (const target of wordList) {
        const match = fuzzyMatch(text, target);

        if (!match.found)
            continue;

        const matchedWord = getMatchedWord(text, match.start, match.end);

        if (exemptWords.some(word => matchedWord.includes(word)))
            continue;

        return true;
    }

    return false;
}