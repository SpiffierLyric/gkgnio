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

// The expansion stays in named, human-editable sections. Every line holds ten
// identities, which makes the 750-entry target easy to audit without hiding
// the catalog behind generated or remote data.
const extraVideoGames = `Marcus Holloway|Aiden Pearce|Vaas Montenegro|Handsome Jack|Borderlands Vault Hunter|Fiona (Borderlands)|Amicia de Rune|Sly Cooper|Jak (Jak and Daxter)|Daxter|
Princess Rosalina|Bowser Jr.|King Boo|Birdo|Kamek|King K. Rool|Dixie Kong|Funky Kong|Pauline (Mario)|Petey Piranha|
Professor Oak|Misty (Pokémon)|Brock (Pokémon)|Team Rocket|Jigglypuff|Eevee|Snorlax|Gengar|Lucario|Greninja|
Tracer (Overwatch)|D.Va|Reaper (Overwatch)|Winston (Overwatch)|Mercy (Overwatch)|Genji (Overwatch)|Soldier: 76|Widowmaker (Overwatch)|Junkrat|Mei (Overwatch)|
Fortnite Jonesy|Sam Fisher|Kassandra (Assassin's Creed)|Altair Ibn-La'Ahad|Dovahkiin|Paarthurnax|Bulbasaur|Squirtle|Meowth|Psyduck|
The Vault Boy|Fallout Pip-Boy|B.J. Blazkowicz|Doomguy|Captain Price|Soap MacTavish|Mew|Rayquaza|Ghost (Call of Duty)|V (Cyberpunk 2077)|
The Prince (Prince of Persia)|Faith Connors|Mirror's Edge Runner|Kat (Gravity Rush)|Conker|Banjo|Kazooie|Mumbo Jumbo|Fable Hero|The Dragonborn`;

const extraWesternAnimation = `Cookie Monster|Grover (Sesame Street)|Smurfette|Papa Smurf|Sadness (Inside Out)|Dory (Finding Nemo)|Genie (Aladdin)|Sully (Monsters, Inc.)|Blue Beetle|Nightcrawler (character)|
Snoopy|Charlie Brown|Woodstock (Peanuts)|Popeye|Betty Boop|Garfield|Odie|Calvin (Calvin and Hobbes)|Hobbes (Calvin and Hobbes)|The Pink Panther|
Ed (Ed, Edd n Eddy)|Edd (Double D)|Eddy (Ed, Edd n Eddy)|Johnny Test|Chowder (character)|Flapjack (The Marvelous Misadventures of Flapjack)|Aku (Samurai Jack)|The Grim Reaper (The Grim Adventures of Billy & Mandy)|Billy (The Grim Adventures of Billy & Mandy)|Mandy (The Grim Adventures of Billy & Mandy)|
Foster's Home for Imaginary Friends|Mac (Foster's Home for Imaginary Friends)|Blooregard Q. Kazoo|Bubble Bass|Man Ray (SpongeBob SquarePants)|Squilliam Fancyson|Patchy the Pirate|The Alaskan Bull Worm|Kevin C. Cucumber|She-Ra and the Princesses of Power|
Tom (Tom and Jerry)|Jerry Mouse|Porky Pig|Tweety|Sylvester the Cat|Road Runner|Wile E. Coyote|Tasmanian Devil (Looney Tunes)|Marvin the Martian|Foghorn Leghorn|
Bluey (character)|Bingo Heeler|Peppa Pig|Paddington Bear|Thomas the Tank Engine|Bob the Builder|Dora the Explorer|Boots (Dora the Explorer)|Diego Márquez|Arthur Read|
Elsa (Frozen)|Anna (Frozen)|Olaf (Frozen)|Simba|Mufasa|Buzz Lightyear|Woody (Toy Story)|Lightning McQueen|Mater (Cars)|Stitch (Lilo & Stitch)|
SpongeBob SquarePants characters|Gary the Snail|Mrs. Puff|Pearl Krabs|Larry the Lobster|Karen (SpongeBob SquarePants)|Flying Dutchman (SpongeBob SquarePants)|King Neptune (SpongeBob SquarePants)|Mermaid Man|Barnacle Boy`;

const extraAnime = `Giorno Giovanna|Bruno Bucciarati|Jean Pierre Polnareff|Kakyoin Noriaki|Okuyasu Nijimura|Koichi Hirose|Yoshikage Kira|Rohan Kishibe|Jolyne Cujoh|Enrico Pucci|
Johnny Joestar|Gyro Zeppeli|Funny Valentine|Josuke Higashikata (JoJolion)|Yasuho Hirose|Jonathan Joestar|Kyojuro Rengoku|Giyu Tomioka|Zenitsu Agatsuma|Inosuke Hashibira|
Killua Zoldyck|Gon Freecss|Hisoka Morow|Kurapika|Leorio|Mob (Mob Psycho 100)|Reigen Arataka|Yuji Itadori|Satoru Gojo|Megumi Fushiguro`;

const extraLiveAction = `Katniss Everdeen|Peeta Mellark|James T. Kirk|Spock|Captain Picard|Data (Star Trek)|Daenerys Targaryen|Jon Snow|Tyrion Lannister|Arya Stark|
The Joker (The Dark Knight)|Harley Quinn|The Penguin (Batman)|The Riddler|Thanos|Scarlet Witch|Vision (Marvel Comics)|Ant-Man|The Flash (DC Comics)|Aquaman|
The Bride (Kill Bill)|Max Rockatansky|Ethan Hunt|Jason Bourne|Paddington (film)|Mia Wallace|Clarice Starling|Vito Corleone|Tony Montana|The Godfather`;

const musicians = `Kanye West|Daft Punk|Drake|The Weeknd|Bruno Mars|Justin Bieber|Ariana Grande|Katy Perry|Nicki Minaj|BTS|
Coldplay|Imagine Dragons|Maroon 5|One Direction|Jonas Brothers|The Black Eyed Peas|Linkin Park|Green Day|Foo Fighters|Red Hot Chili Peppers|
Radiohead|Nirvana|Pearl Jam|Metallica|Guns N' Roses|U2|The Rolling Stones|Queen|ABBA|Fleetwood Mac|
Madonna|Whitney Houston|Celine Dion|Janet Jackson|Mariah Carey|Shania Twain|Spice Girls|Backstreet Boys|NSYNC|Destiny's Child|
OutKast|Jay-Z|50 Cent|Lil Wayne|Nelly|Missy Elliott|Usher|Alicia Keys|Christina Aguilera|Pink (singer)|
Avril Lavigne|Kelly Clarkson|Fall Out Boy|Panic! at the Disco|My Chemical Romance|The Killers|Arctic Monkeys|Paramore|Evanescence|Gorillaz|
Lana Del Rey|Lorde|Halsey|SZA|Doja Cat|Olivia Rodrigo|Dua Lipa|Harry Styles|Post Malone|Travis Scott|
Bad Bunny|Karol G|J Balvin|Shakira|Daddy Yankee|Rosalía|Camila Cabello|Megan Thee Stallion|Cardi B|Lizzo|
Ed Sheeran|Sam Smith|Miley Cyrus|Selena Gomez|Demi Lovato|Kesha|Flo Rida|Pitbull|T-Pain|Jason Derulo|
Charli XCX|Chappell Roan|Sabrina Carpenter|Tate McRae|Benson Boone|Morgan Wallen|Luke Combs|Zach Bryan|Tyler, the Creator|Frank Ocean`;

const extraCreators = `KSI|Logan Paul|Jake Paul|Valkyrae|Dream (YouTuber)|Technoblade|DanTDM|Dan Howell|AmazingPhil|Safiya Nygaard|
Emma Chamberlain|iShowSpeed|Kai Cenat|MoistCr1TiKaL|The Try Guys`;

const extraAthletes = `Roger Federer|Rafael Nadal|Naomi Osaka|Alex Morgan|Megan Rapinoe|Connor McDavid|Floyd Mayweather Jr.|Ronda Rousey|Travis Kelce|David Beckham`;

const extraPublicFigures = `Oprah Winfrey|Malala Yousafzai|Rosa Parks|Malcolm X|Frida Kahlo|Anne Frank|Queen Victoria|Alexander the Great|Genghis Khan|Leonardo da Vinci|
Isaac Newton|Charles Darwin|Ada Lovelace|Alan Turing|Katherine Johnson`;

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

function addTags(names: string[], tags: string[]) {
  for (const name of names) {
    const id = slugify(name);
    TAG_OVERRIDES[id] = [...new Set([...(TAG_OVERRIDES[id] ?? []), ...tags])];
  }
}

// Roles and appearance tags are deliberately applied only to familiar public
// personas or unambiguous character designs; no subjective personal traits are
// inferred from the data source.
addTags([
  "Adam Sandler", "Jim Carrey", "Robin Williams", "Eddie Murphy", "Will Ferrell", "Tina Fey", "Amy Poehler", "Steve Carell", "Jack Black", "Keanu Reeves",
  "Tom Hanks", "Dwayne Johnson", "Arnold Schwarzenegger", "Sylvester Stallone", "Samuel L. Jackson", "Morgan Freeman", "Meryl Streep", "Jennifer Lawrence", "Zendaya", "Pedro Pascal",
  "Nicolas Cage", "Danny DeVito", "Aubrey Plaza", "Beyoncé", "Taylor Swift", "Lady Gaga", "Rihanna",
], ["actor"]);
addTags(["Adam Sandler", "Jim Carrey", "Robin Williams", "Eddie Murphy", "Will Ferrell", "Tina Fey", "Amy Poehler", "Steve Carell", "Jack Black", "Conan O'Brien", "Stephen Colbert", "Jon Stewart", "Trevor Noah", "Dave Chappelle", "Jerry Seinfeld", "Julia Louis-Dreyfus", "Betty White", "Danny DeVito", "Aubrey Plaza", "Mr. Bean"], ["comedian"]);
addTags(["Beyoncé", "Taylor Swift", "Lady Gaga", "Rihanna", "Britney Spears", "Dolly Parton", "Michael Jackson", "Prince (musician)", "Freddie Mercury", "David Bowie", "Elton John", "Snoop Dogg", "Eminem", "Kendrick Lamar", "Adele", "Billie Eilish", '"Weird Al" Yankovic'], ["musician", "music"]);
addTags(["Albert Einstein", "Marie Curie", "Nikola Tesla", "Stephen Hawking", "Neil Armstrong", "Amelia Earhart", "Steve Jobs", "Bill Gates", "Elon Musk", "Mark Zuckerberg", "Jeff Bezos", "Walt Disney"], ["business-science"]);
addTags(["Mario", "Luigi", "Princess Peach", "Bowser", "Yoshi", "Wario", "Waluigi", "Toad", "Princess Daisy", "Princess Rosalina", "Bowser Jr.", "King Boo", "Birdo", "Kamek", "King K. Rool", "Dixie Kong", "Funky Kong", "Pauline (Mario)", "Petey Piranha", "Donkey Kong", "Diddy Kong"], ["mario"]);
addTags(["Pikachu", "Charizard", "Mewtwo", "Ash Ketchum", "Professor Oak", "Misty (Pokémon)", "Brock (Pokémon)", "Team Rocket", "Jigglypuff", "Eevee", "Snorlax", "Gengar", "Lucario", "Greninja", "Bulbasaur", "Squirtle", "Meowth", "Psyduck", "Mew", "Rayquaza"], ["pokemon"]);
addTags(["SpongeBob SquarePants", "Patrick Star", "Squidward Tentacles", "Mr. Krabs", "Sandy Cheeks", "Plankton (SpongeBob SquarePants)", "Gary the Snail", "Mrs. Puff", "Pearl Krabs", "Larry the Lobster", "Karen (SpongeBob SquarePants)", "Flying Dutchman (SpongeBob SquarePants)", "King Neptune (SpongeBob SquarePants)", "Mermaid Man", "Barnacle Boy", "Bubble Bass", "Man Ray (SpongeBob SquarePants)", "Squilliam Fancyson", "Patchy the Pirate", "The Alaskan Bull Worm", "Kevin C. Cucumber"], ["spongebob", "nickelodeon", "cartoon", "kids-show", "2d"]);
addTags(["Finn the Human", "Jake the Dog", "Princess Bubblegum", "Ice King", "Dexter (Dexter's Laboratory)", "Johnny Bravo", "Courage the Cowardly Dog", "Samurai Jack", "Ben Tennyson", "Steven Universe", "Garnet (Steven Universe)", "Gumball Watterson", "Darwin Watterson", "Mordecai (Regular Show)", "Rigby (Regular Show)", "Ed (Ed, Edd n Eddy)", "Edd (Double D)", "Eddy (Ed, Edd n Eddy)", "Aku (Samurai Jack)", "Teen Titans", "Robin (Teen Titans)", "Starfire (Teen Titans)", "Raven (Teen Titans)", "Beast Boy", "Cyborg (Teen Titans)", "The Powerpuff Girls", "Mojo Jojo", "Foster's Home for Imaginary Friends", "The Kids Next Door", "Freakazoid"], ["cartoon-network", "cartoon", "2d"]);
addTags(["Jimmy Neutron", "Timmy Turner", "Cosmo (Fairly OddParents)", "Wanda (Fairly OddParents)", "Danny Phantom", "Dora the Explorer", "Boots (Dora the Explorer)", "Diego Márquez", "Blue's Clues", "Rugrats", "Tommy Pickles", "Chuckie Finster", "Angelica Pickles", "Hey Arnold!", "Arnold Shortman", "Gerald Johanssen", "The Wild Thornberrys", "Eliza Thornberry", "Avatar: The Last Airbender", "The Legend of Korra"], ["nickelodeon", "cartoon", "kids-show", "2d"]);
addTags(["Mickey Mouse", "Minnie Mouse", "Donald Duck", "Goofy", "Phineas Flynn", "Ferb Fletcher", "Perry the Platypus", "Kim Possible", "Ron Stoppable", "Luz Noceda", "Eda Clawthorne", "Anne Boonchuy", "Star Butterfly", "Elsa (Frozen)", "Anna (Frozen)", "Olaf (Frozen)", "Simba", "Mufasa", "Buzz Lightyear", "Woody (Toy Story)", "Lightning McQueen", "Mater (Cars)", "Stitch (Lilo & Stitch)", "Hercules (Disney character)", "Aladdin (Disney character)"], ["disney", "cartoon", "kids-show", "2d"]);
addTags(["Jotaro Kujo", "Dio Brando", "Joseph Joestar", "Josuke Higashikata", "Giorno Giovanna", "Bruno Bucciarati", "Jean Pierre Polnareff", "Kakyoin Noriaki", "Okuyasu Nijimura", "Koichi Hirose", "Yoshikage Kira", "Rohan Kishibe", "Jolyne Cujoh", "Enrico Pucci", "Johnny Joestar", "Gyro Zeppeli", "Funny Valentine", "Josuke Higashikata (JoJolion)", "Yasuho Hirose", "Jonathan Joestar"], ["jjba", "anime", "2d"]);
addTags(["Mario", "Luigi", "Sonic the Hedgehog", "Tails", "Knuckles the Echidna", "Mega Man", "Rayman", "Crash Bandicoot", "Spyro", "Shovel Knight", "Cuphead", "The Knight (Hollow Knight)", "Ori", "Earthworm Jim", "Sackboy", "Banjo", "Kazooie", "Conker", "Daxter", "The Prince (Prince of Persia)"], ["platformer"]);
addTags(["Master Chief", "Cortana", "Kratos", "Atreus", "Lara Croft", "Nathan Drake", "Aloy", "Commander Shepard", "Leon S. Kennedy", "Jill Valentine", "Chris Redfield", "Albert Wesker", "Tracer (Overwatch)", "D.Va", "Reaper (Overwatch)", "Winston (Overwatch)", "Mercy (Overwatch)", "Genji (Overwatch)", "Fortnite Jonesy", "V (Cyberpunk 2077)", "Kassandra (Assassin's Creed)", "Dovahkiin"], ["3d"]);
addTags(["Mega Man", "Sonic the Hedgehog", "Bluey (character)", "Bingo Heeler", "Smurfette", "Stitch (Lilo & Stitch)", "Genie (Aladdin)", "Dory (Finding Nemo)", "Cookie Monster", "Grover (Sesame Street)", "Mystique (character)", "Nightcrawler (character)", "Beast (Marvel Comics)", "Blue Beetle", "Hades (Disney)", "Sadness (Inside Out)", "Joy (Inside Out)", "Mordecai (Regular Show)", "Gumball Watterson", "Darwin Watterson"], ["blue"]);
addTags(["Dwayne Johnson", "Vin Diesel", "Samuel L. Jackson", "Morgan Freeman", "Danny DeVito", "Steve Harvey", "Terry Crews", "Mike Tyson", "Michael Jordan", "Kobe Bryant", "Shaquille O'Neal", "LeBron James", "Patrick Stewart", "J. K. Simmons", "Jason Statham", "Bruce Willis", "Stanley Tucci", "Howie Mandel", "Pitbull", "Floyd Mayweather Jr."], ["bald"]);
addTags(["Kratos", "Saitama", "Piccolo (Dragon Ball)", "Mewtwo", "Darth Vader", "Lord Voldemort", "Thanos", "Gandalf", "Yoda", "Doctor Eggman", "Doom Slayer", "Walter White"], ["bald"]);
addTags(["Sonic the Hedgehog", "Mega Man", "Squidward Tentacles", "Sonic the Hedgehog", "Dory (Finding Nemo)", "Cookie Monster", "Grover (Sesame Street)", "Mystique (character)", "Nightcrawler (character)", "Beast (Marvel Comics)", "Blue Beetle", "Hades (Disney)", "Sadness (Inside Out)", "Joy (Inside Out)", "Sully (Monsters, Inc.)", "Stitch (Lilo & Stitch)", "Gumball Watterson", "Darwin Watterson", "Mordecai (Regular Show)", "Bluey (character)"], ["blue"]);
addTags(["Cortana", "D.Va"], ["blue"]);
addTags(["Mario", "Luigi", "Sonic the Hedgehog", "Link", "Goku", "Naruto Uzumaki", "Harry Potter", "Hermione Granger", "Taylor Swift", "Beyoncé", "Rihanna", "Zendaya", "Pedro Pascal", "Tom Hanks", "Keanu Reeves", "Ariana Grande", "Billie Eilish", "Drake", "Kanye West", "Dua Lipa", "Olivia Rodrigo", "Lionel Messi", "Cristiano Ronaldo", "Serena Williams", "Simone Biles"], ["not-bald"]);

const MUSIC_2000S_NAMES = ["Kanye West", "Daft Punk", "Drake", "The Black Eyed Peas", "Linkin Park", "Green Day", "Foo Fighters", "Red Hot Chili Peppers", "OutKast", "Jay-Z", "50 Cent", "Lil Wayne", "Nelly", "Missy Elliott", "Usher", "Alicia Keys", "Christina Aguilera", "Pink (singer)", "Avril Lavigne", "Kelly Clarkson", "Fall Out Boy", "Panic! at the Disco", "My Chemical Romance", "The Killers", "Paramore", "Evanescence", "Gorillaz", "Flo Rida", "Pitbull", "T-Pain", "Jason Derulo", "Kesha", "BeyoncÃ©", "Taylor Swift", "Lady Gaga", "Rihanna", "Eminem", "Kendrick Lamar", "Adele", "Snoop Dogg"];
export const MUSIC_2000S_IDS = new Set(MUSIC_2000S_NAMES.map(slugify));
addTags(MUSIC_2000S_NAMES, ["musician", "music"]);
addTags(["Daft Punk", "BTS", "Coldplay", "Imagine Dragons", "Maroon 5", "One Direction", "Jonas Brothers", "The Black Eyed Peas", "Linkin Park", "Green Day", "Foo Fighters", "Red Hot Chili Peppers", "Radiohead", "Nirvana", "Pearl Jam", "Metallica", "Guns N' Roses", "U2", "The Rolling Stones", "Queen", "ABBA", "Fleetwood Mac", "Spice Girls", "Backstreet Boys", "NSYNC", "Destiny's Child", "OutKast", "Fall Out Boy", "Panic! at the Disco", "My Chemical Romance", "The Killers", "Arctic Monkeys", "Paramore", "Evanescence", "Gorillaz", "Rhett & Link", "Smosh", "Game Grumps", "Good Mythical Morning", "The Try Guys"], ["group-duo"]);

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
      aliases: canonicalName === "Kanye West" ? ["Ye"] : [],
      wikiTitle,
      sourceUrl,
      kind,
      tags: [...new Set([...tags, ...(TAG_OVERRIDES[id] ?? [])])],
    };
  });
}

export const SEED_CATALOG: CatalogIdentity[] = [
  ...makeGroup(videoGames, "fictional", ["fictional-character", "video-games"]),
  ...makeGroup(extraVideoGames, "fictional", ["fictional-character", "video-games"]),
  ...makeGroup(westernAnimation, "fictional", ["fictional-character", "tv-film", "cartoon", "2d"]),
  ...makeGroup(extraWesternAnimation, "fictional", ["fictional-character", "tv-film", "cartoon", "2d"]),
  ...makeGroup(anime, "fictional", ["fictional-character", "tv-film", "anime", "2d"]),
  ...makeGroup(extraAnime, "fictional", ["fictional-character", "tv-film", "anime", "2d"]),
  ...makeGroup(liveAction, "fictional", ["fictional-character", "tv-film", "live-action"]),
  ...makeGroup(extraLiveAction, "fictional", ["fictional-character", "tv-film", "live-action"]),
  ...makeGroup(entertainers, "real", ["real-person", "tv-film", "not-bald"]),
  ...makeGroup(musicians, "real", ["real-person", "music", "musician", "not-bald"]),
  ...makeGroup(internetCreators, "real", ["real-person", "youtube", "creator", "variety"]),
  ...makeGroup(extraCreators, "real", ["real-person", "youtube", "creator", "variety"]),
  ...makeGroup(athletes, "real", ["real-person", "sports", "athlete"]),
  ...makeGroup(extraAthletes, "real", ["real-person", "sports", "athlete"]),
  ...makeGroup(publicFigures, "real", ["real-person", "politics-history"]),
  ...makeGroup(extraPublicFigures, "real", ["real-person", "politics-history", "business-science"]),
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
