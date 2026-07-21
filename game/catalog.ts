import type { CatalogIdentity, TagDefinition } from "./types";

export const TAGS: TagDefinition[] = [
  { slug: "fictional-character", label: "Fictional Character", facet: "Entity Kind" },
  { slug: "real-person", label: "Real Person", facet: "Entity Kind" },
  { slug: "group-duo", label: "Group / Duo", facet: "Entity Kind", implies: ["real-person"] },
  { slug: "video-games", label: "Video Games", facet: "Medium" },
  { slug: "tv-film", label: "TV / Film", facet: "Medium" },
  { slug: "youtube", label: "YouTube", facet: "Medium", implies: ["real-person"] },
  { slug: "music", label: "Music", facet: "Medium", implies: ["real-person"] },
  { slug: "sports", label: "Sports", facet: "Medium", implies: ["real-person"] },
  { slug: "politics-history", label: "Politics / History", facet: "Medium", implies: ["real-person"] },
  { slug: "business-science", label: "Business / Science", facet: "Medium", implies: ["real-person"] },
  { slug: "2d", label: "2D", facet: "Visual Style" },
  { slug: "3d", label: "3D", facet: "Visual Style" },
  { slug: "live-action", label: "Live Action", facet: "Visual Style" },
  { slug: "cartoon", label: "Cartoon", facet: "Format", implies: ["tv-film"] },
  { slug: "anime", label: "Anime", facet: "Format", implies: ["tv-film"] },
  { slug: "kids-show", label: "Kids Show", facet: "Format", implies: ["tv-film"] },
  { slug: "actor", label: "Actor", facet: "Role", implies: ["real-person", "tv-film"] },
  { slug: "comedian", label: "Comedian", facet: "Role", implies: ["real-person"] },
  { slug: "creator", label: "Creator", facet: "Role", implies: ["real-person"] },
  { slug: "musician", label: "Musician", facet: "Role", implies: ["real-person", "music"] },
  { slug: "athlete", label: "Athlete", facet: "Role", implies: ["real-person", "sports"] },
  { slug: "cartoon-network", label: "Cartoon Network", facet: "Network / Platform" },
  { slug: "nickelodeon", label: "Nickelodeon", facet: "Network / Platform" },
  { slug: "disney", label: "Disney", facet: "Network / Platform" },
  { slug: "spongebob", label: "SpongeBob", facet: "Franchise / IP" },
  { slug: "jjba", label: "JJBA", facet: "Franchise / IP" },
  { slug: "pokemon", label: "Pokémon", facet: "Franchise / IP" },
  { slug: "mario", label: "Mario", facet: "Franchise / IP" },
  { slug: "blue", label: "Blue", facet: "Appearance" },
  { slug: "not-bald", label: "Not Bald", facet: "Appearance" },
  { slug: "bald", label: "Bald", facet: "Appearance" },
  { slug: "variety", label: "Variety", facet: "Format" },
  { slug: "platformer", label: "Platformer", facet: "Genre" },
];

const videoGames = `Mario|Luigi|Princess Peach|Bowser|Yoshi|Donkey Kong|Diddy Kong|Wario|Waluigi|Toad|
Link|Princess Zelda|Ganondorf|Midna|Kirby|Meta Knight|Samus Aran|Ridley|Captain Falcon|Fox McCloud|
Pikachu|Charizard|Mewtwo|Ash Ketchum|Sonic the Hedgehog|Tails|Knuckles the Echidna|Shadow the Hedgehog|Doctor Eggman|Amy Rose|
Mega Man|Pac-Man|Lara Croft|Master Chief|Cortana|Kratos|Atreus|Solid Snake|Cloud Strife|Sephiroth|
Tifa Lockhart|Aerith Gainsborough|Sora|Riku|Crash Bandicoot|Spyro|Rayman|Doom Slayer|Gordon Freeman|GLaDOS|
Chell|Steve (Minecraft)|Creeper|Geralt of Rivia|Ciri|Arthur Morgan|John Marston|Nathan Drake|Joel Miller|Ellie Williams|
Aloy|Commander Shepard|Leon S. Kennedy|Jill Valentine|Chris Redfield|Albert Wesker|Phoenix Wright|Professor Layton|Agent 47|Ezio Auditore|
Scorpion (Mortal Kombat)|Sub-Zero|Chun-Li|Ryu (Street Fighter)|Ken Masters|Liu Kang|Johnny Cage|Princess Daisy|Bayonetta|Dante (Devil May Cry)|
Vergil (Devil May Cry)|Isabelle (Animal Crossing)|Tom Nook|Villager (Animal Crossing)|Inkling (Splatoon)|Shovel Knight|Cuphead|Sans (Undertale)|Papyrus (Undertale)|Frisk (Undertale)|
Zagreus|The Knight (Hollow Knight)|Ori|Marcus Fenix|Duke Nukem|Earthworm Jim|Guybrush Threepwood|Ratchet (Ratchet & Clank)|Clank (Ratchet & Clank)|Sackboy`;

const westernAnimation = `SpongeBob SquarePants|Patrick Star|Squidward Tentacles|Mr. Krabs|Sandy Cheeks|Plankton (SpongeBob SquarePants)|Finn the Human|Jake the Dog|Princess Bubblegum|Ice King|
Jimmy Neutron|Timmy Turner|Cosmo (Fairly OddParents)|Wanda (Fairly OddParents)|Danny Phantom|Aang|Katara|Zuko|Toph Beifong|Korra|
Mickey Mouse|Minnie Mouse|Donald Duck|Goofy|Bugs Bunny|Daffy Duck|Scooby-Doo|Shaggy Rogers|Fred Flintstone|Homer Simpson|
Bart Simpson|Lisa Simpson|Peter Griffin|Stewie Griffin|Rick Sanchez|Morty Smith|BoJack Horseman|Blossom (Powerpuff Girls)|Bubbles (Powerpuff Girls)|Buttercup (Powerpuff Girls)|
Dexter (Dexter's Laboratory)|Johnny Bravo|Courage the Cowardly Dog|Samurai Jack|Ben Tennyson|Steven Universe|Garnet (Steven Universe)|Gumball Watterson|Darwin Watterson|Mordecai (Regular Show)|
Rigby (Regular Show)|Phineas Flynn|Ferb Fletcher|Perry the Platypus|Kim Possible|Ron Stoppable|Luz Noceda|Eda Clawthorne|Anne Boonchuy|Star Butterfly`;

const anime = `Goku|Vegeta|Gohan|Piccolo (Dragon Ball)|Naruto Uzumaki|Sasuke Uchiha|Sakura Haruno|Kakashi Hatake|Monkey D. Luffy|Roronoa Zoro|
Nami (One Piece)|Sanji (One Piece)|Jotaro Kujo|Dio Brando|Joseph Joestar|Josuke Higashikata|Ichigo Kurosaki|Rukia Kuchiki|Sailor Moon|Tuxedo Mask|
Edward Elric|Alphonse Elric|Light Yagami|L (Death Note)|Ryuk (Death Note)|Spike Spiegel|Faye Valentine|Saitama|Genos|All Might|
Izuku Midoriya|Katsuki Bakugo|Tanjiro Kamado|Nezuko Kamado|Eren Yeager|Mikasa Ackerman|Levi Ackerman|Shinji Ikari|Rei Ayanami|Totoro`;

const liveAction = `Harry Potter|Hermione Granger|Ron Weasley|Albus Dumbledore|Lord Voldemort|Frodo Baggins|Gandalf|Aragorn|Legolas|Gollum|
Luke Skywalker|Princess Leia|Han Solo|Darth Vader|Obi-Wan Kenobi|Yoda|The Mandalorian|Grogu|Indiana Jones|James Bond|
Batman|Superman|Wonder Woman|Spider-Man|Iron Man|Captain America|Thor|Hulk|Black Widow|Loki|
Wolverine|Deadpool|Doctor Strange|Black Panther|Marty McFly|Doc Brown|Neo (The Matrix)|Trinity (The Matrix)|Morpheus (The Matrix)|John Wick|
Rocky Balboa|John Rambo|Ellen Ripley|Sarah Connor|Terminator (character)|Jack Sparrow|Will Turner|Wednesday Addams|Beetlejuice|Willy Wonka|
Sherlock Holmes|The Doctor (Doctor Who)|Eleven (Stranger Things)|Jim Hopper|Walter White|Jesse Pinkman|Saul Goodman|Michael Scott (The Office)|Dwight Schrute|Ron Swanson|
Leslie Knope|Ted Lasso|Mr. Bean|The Dude|Ace Ventura|Ferris Bueller|Forrest Gump|Hannibal Lecter|Norman Bates|Ghostface (Scream)|
Freddy Krueger|Jason Voorhees|Michael Myers (Halloween)|Buffy Summers|Xena`;

const entertainers = `Adam Sandler|Jim Carrey|Robin Williams|Eddie Murphy|Will Ferrell|Tina Fey|Amy Poehler|Steve Carell|Jack Black|Keanu Reeves|
Tom Hanks|Dwayne Johnson|Arnold Schwarzenegger|Sylvester Stallone|Samuel L. Jackson|Morgan Freeman|Meryl Streep|Jennifer Lawrence|Zendaya|Pedro Pascal|
Beyoncé|Taylor Swift|Lady Gaga|Rihanna|Britney Spears|Dolly Parton|Michael Jackson|Prince (musician)|Elvis Presley|Freddie Mercury|
David Bowie|Elton John|Snoop Dogg|Eminem|Kendrick Lamar|Adele|Billie Eilish|"Weird Al" Yankovic|Gordon Ramsay|Conan O'Brien|
Stephen Colbert|Jon Stewart|Trevor Noah|Dave Chappelle|Jerry Seinfeld|Julia Louis-Dreyfus|Betty White|Nicolas Cage|Danny DeVito|Aubrey Plaza`;

const internetCreators = `Rhett & Link|MrBeast|PewDiePie|Markiplier|Jacksepticeye|Pokimane|Ninja (gamer)|Ludwig Ahgren|Hasan Piker|Cr1TiKaL|
Hank Green|John Green|Marques Brownlee|Casey Neistat|Jenna Marbles|Smosh|Game Grumps|MatPat|Vsauce|Kurzgesagt|
Linus Sebastian|Philip DeFranco|DougDoug|Jerma985|Good Mythical Morning`;

const athletes = `Michael Jordan|LeBron James|Kobe Bryant|Shaquille O'Neal|Stephen Curry|Serena Williams|Venus Williams|Tiger Woods|Tom Brady|Patrick Mahomes|
Lionel Messi|Cristiano Ronaldo|Simone Biles|Usain Bolt|Muhammad Ali|Mike Tyson|Wayne Gretzky|Babe Ruth|Shohei Ohtani|Caitlin Clark`;

const publicFigures = `Barack Obama|Donald Trump|Joe Biden|George Washington|Abraham Lincoln|Theodore Roosevelt|Winston Churchill|Elizabeth II|Diana, Princess of Wales|Napoleon|
Julius Caesar|Cleopatra|Joan of Arc|Mahatma Gandhi|Martin Luther King Jr.|Nelson Mandela|Albert Einstein|Marie Curie|Nikola Tesla|Stephen Hawking|
Neil Armstrong|Amelia Earhart|Steve Jobs|Bill Gates|Elon Musk|Mark Zuckerberg|Jeff Bezos|Walt Disney|Fred Rogers|Bob Ross`;

function parseNames(value: string) {
  return value
    .split("|")
    .map((name) => name.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const TAG_OVERRIDES: Record<string, string[]> = {
  "mega-man": ["2d", "platformer", "blue"],
  "sonic-the-hedgehog": ["platformer", "blue"],
  mario: ["platformer", "mario", "not-bald"],
  luigi: ["platformer", "mario", "not-bald"],
  "princess-peach": ["mario", "not-bald"],
  bowser: ["mario"],
  "spongebob-squarepants": ["2d", "cartoon", "kids-show", "nickelodeon", "spongebob"],
  "patrick-star": ["2d", "cartoon", "kids-show", "nickelodeon", "spongebob"],
  "squidward-tentacles": ["2d", "cartoon", "kids-show", "nickelodeon", "spongebob"],
  "finn-the-human": ["2d", "cartoon", "kids-show", "cartoon-network"],
  "jimmy-neutron": ["3d", "cartoon", "kids-show", "nickelodeon"],
  "jotaro-kujo": ["2d", "anime", "jjba", "not-bald"],
  "dio-brando": ["2d", "anime", "jjba", "not-bald"],
  pikachu: ["pokemon"],
  charizard: ["pokemon"],
  mewtwo: ["pokemon"],
  "ash-ketchum": ["pokemon", "2d", "anime", "not-bald"],
  "adam-sandler": ["actor", "comedian", "not-bald"],
  "rhett-link": ["group-duo", "youtube", "creator", "variety", "not-bald"],
};

function makeGroup(
  source: string,
  kind: CatalogIdentity["kind"],
  tags: string[],
): CatalogIdentity[] {
  return parseNames(source).map((canonicalName) => {
    const id = slugify(canonicalName);
    const wikiTitle = canonicalName;
    const sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replaceAll(" ", "_"))}`;
    return {
      id,
      canonicalName,
      aliases: [],
      wikiTitle,
      sourceUrl,
      kind,
      tags: [...new Set([...tags, ...(TAG_OVERRIDES[id] ?? [])])],
    };
  });
}

export const SEED_CATALOG: CatalogIdentity[] = [
  ...makeGroup(videoGames, "fictional", ["fictional-character", "video-games"]),
  ...makeGroup(westernAnimation, "fictional", ["fictional-character", "tv-film", "cartoon", "2d"]),
  ...makeGroup(anime, "fictional", ["fictional-character", "tv-film", "anime", "2d"]),
  ...makeGroup(liveAction, "fictional", ["fictional-character", "tv-film", "live-action"]),
  ...makeGroup(entertainers, "real", ["real-person", "tv-film", "not-bald"]),
  ...makeGroup(internetCreators, "real", ["real-person", "youtube", "creator", "variety"]),
  ...makeGroup(athletes, "real", ["real-person", "sports", "athlete"]),
  ...makeGroup(publicFigures, "real", ["real-person", "politics-history"]),
].map((identity) => ({
  ...identity,
  kind: identity.tags.includes("group-duo") ? "group" : identity.kind,
}));

export function expandEffectiveTags(tags: string[]) {
  const definitions = new Map(TAGS.map((tag) => [tag.slug, tag]));
  const result = new Set(tags);
  const pending = [...tags];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const implied of definitions.get(current)?.implies ?? []) {
      if (!result.has(implied)) {
        result.add(implied);
        pending.push(implied);
      }
    }
  }
  return [...result];
}

export function filterCatalog(
  catalog: CatalogIdentity[],
  allTags: string[],
  anyTags: string[],
) {
  return catalog.filter((identity) => {
    const tags = new Set(expandEffectiveTags(identity.tags));
    const matchesAll = allTags.every((tag) => tags.has(tag));
    const matchesAny = anyTags.length === 0 || anyTags.some((tag) => tags.has(tag));
    return matchesAll && matchesAny;
  });
}

export function identityImageUrl(identity: CatalogIdentity) {
  if (identity.imageKey) return `/api/media/${encodeURIComponent(identity.imageKey)}`;
  if (identity.imageUrl) return identity.imageUrl;
  return `/api/media/wiki/${encodeURIComponent(identity.wikiTitle ?? identity.canonicalName)}`;
}
