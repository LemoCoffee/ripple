const colors = {
	intellectualpotato: [120, 200, 120],
	"i.p.": [120, 200, 120],
	intellecutalpotato: [120, 200, 120],
	intelelctualpotato: [120, 200, 120],
	aether: [80, 0, 50],
	salithin: [125, 64, 113],
	run: [200, 50, 50],
	"run!!!": [200, 50, 50],
	vivian: [255, 105, 97],
	muffin: [160, 100, 50],
	tomi: [180, 180, 255],
	mari: [255, 115, 20],
	dark: [5, 0, 5],
	mark: [255, 117, 0],
	markku: [255, 117, 0],
	akari: [170, 50, 170],
	dodeca: [87, 59, 183],
	lng1lnd: [100, 100, 150],
	panton_cleo: [0, 255, 0],
	skolli: [255, 160, 232],
	skoli: [255, 160, 232],
	"n.r.": [150, 41, 134],
	fish: [255, 115, 50],
	lafta: [0, 128, 128],
	pix: [255, 105, 180],
	shimmer: [150, 150, 255],
	gecko: [60, 180, 60],
	den4ik17: [65, 130, 95],
	echoblu: [90, 100, 255],
	"traya tyto": [229, 175, 110],
	hazmat141: [101, 165, 227],
	chlebiri: [157, 0, 111],
	artanis: [255, 110, 231],
	"m.d.": [242, 242, 162],
	g3: [255, 95, 0],
	goldbrick: [255, 255, 125],
	lc: [253, 203, 88],
};

function get_signature(message) {
	return typeof message === 'string'
		? message.match(/(?:[~-]+\s*)(.+)$/)?.[1]?.toLowerCase()
		: undefined
}

export function getSignatureColor(message) {
    const signature = get_signature(message)
    if (signature && signature in colors) {
	    return colors[signature]
    }
    return [175, 238, 238]
}