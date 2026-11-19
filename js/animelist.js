const VALID_FORMATS = new Set(["TV", "ONA", "OVA"]);
const animeCache = new Map();
let lastRequestTime = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAniList(query, variables, retries = 3) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    
    if (elapsed < 1500) {
        await sleep(1500 - elapsed);
    }
    lastRequestTime = Date.now();

    try {
        const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.warn("Possibile rate-limit (429) o errore di rete. Attendo 30s prima di riprovare...");
            await sleep(30000);
            return fetchAniList(query, variables, retries - 1);
        }
        console.error("Errore definitivo fetchAniList:", error);
        return null;
    }
}


function cacheMediaTree(media) {
    if (!media || !media.id) return;

    const existing = animeCache.get(media.id);
    
    if (!existing || (!existing.relations && media.relations)) {
        animeCache.set(media.id, media);
    }

    if (media.relations?.edges) {
        for (const edge of media.relations.edges) {
            if (edge.node) {
                cacheMediaTree(edge.node);
            }
        }
    }
}

async function getAnimeFast(id) {
    const cached = animeCache.get(id);
    if (cached && cached.relations) {
        return cached;
    }

    const query = `
    query ($id: Int) {
        Media(id: $id, type: ANIME) {
            id
            title { romaji }
            coverImage { large }
            relations {
                edges {
                    relationType
                    node {
                        id
                        type
                        format
                        title { romaji }
                        coverImage { large }
                        relations {
                            edges {
                                relationType
                                node {
                                    id
                                    type
                                    format
                                    title { romaji }
                                    coverImage { large }
                                }
                            }
                        }
                    }
                }
            }
        }
    }`;

    const data = await fetchAniList(query, { id });
    const media = data?.data?.Media || null;
    if (media) cacheMediaTree(media);
    return media;
}

function findNextEdge(media, relationType) {
    return media?.relations?.edges?.find(
        edge =>
            edge.relationType === relationType &&
            edge.node?.type === "ANIME" &&
            VALID_FORMATS.has(edge.node?.format)
    );
}

export async function* getAnimeGenerator() {
    let page = 1;
    let hasNextPage = true;
    const visitedIds = new Set();

    while (hasNextPage) {
        const query = `
        query ($page: Int) {
            Page(page: $page, perPage: 50) {
                pageInfo { hasNextPage }
                media(type: ANIME, sort: [POPULARITY_DESC]) {
                    id
                    title { romaji }
                    coverImage { large }
                    relations {
                        edges {
                            relationType
                            node {
                                id
                                type
                                format
                                title { romaji }
                                coverImage { large }
                                relations {
                                    edges {
                                        relationType
                                        node {
                                            id
                                            type
                                            format
                                            title { romaji }
                                            coverImage { large }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`;

        const data = await fetchAniList(query, { page });

        if (!data?.data?.Page) {
            console.error("Pagina non disponibile:", data);
            break;
        }

        for (const anime of data.data.Page.media) {
            cacheMediaTree(anime);
        }

        for (const anime of data.data.Page.media) {
            if (visitedIds.has(anime.id)) continue;

            let firstSeason = anime;
            const chainCheck = new Set([firstSeason.id]);

            while (true) {
                const prequelEdge = findNextEdge(firstSeason, "PREQUEL");
                if (!prequelEdge || chainCheck.has(prequelEdge.node.id)) break;

                chainCheck.add(prequelEdge.node.id);
                const prevAnime = await getAnimeFast(prequelEdge.node.id);
                if (!prevAnime) break;

                firstSeason = prevAnime;
            }

            let currentSeason = firstSeason;

            while (currentSeason && !visitedIds.has(currentSeason.id)) {
                visitedIds.add(currentSeason.id);

                yield {
                    id: currentSeason.id,
                    title: currentSeason.title,
                    coverImage: currentSeason.coverImage
                };

                const sequelEdge = findNextEdge(currentSeason, "SEQUEL");
                if (!sequelEdge || visitedIds.has(sequelEdge.node.id)) break;

                currentSeason = await getAnimeFast(sequelEdge.node.id);
            }
        }

        hasNextPage = data.data.Page.pageInfo.hasNextPage;
        page++;
    }
}
