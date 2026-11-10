/**
 * =====================================================================
 *  Datos iniciales del catálogo (los mismos del Proyecto 1).
 *  6 estudios · 6 plataformas · 18 juegos
 *  Los carga en Redis el script  scripts/cargar-redis.mjs
 * =====================================================================
 */

export const estudios = [
  {
    "id": 1,
    "nombre": "Nintendo EPD",
    "pais": "Japón",
    "anio_fundacion": 2015,
    "fundador": "Shinya Takahashi",
    "sitio_web": "https://www.nintendo.com",
    "descripcion": "División interna de Nintendo nacida de la fusión de EAD y SPD. Responsable de las sagas Mario, Zelda y Splatoon en la era Switch.",
    "imagen": "/img/estudios/1.jpg"
  },
  {
    "id": 2,
    "nombre": "Rockstar Games",
    "pais": "Estados Unidos",
    "anio_fundacion": 1998,
    "fundador": "Sam Houser",
    "sitio_web": "https://www.rockstargames.com",
    "descripcion": "Editora y desarrolladora con sede en Nueva York, conocida por mundos abiertos de gran escala y por la saga Grand Theft Auto.",
    "imagen": "/img/estudios/2.jpg"
  },
  {
    "id": 3,
    "nombre": "FromSoftware",
    "pais": "Japón",
    "anio_fundacion": 1986,
    "fundador": "Naotoshi Zin",
    "sitio_web": "https://www.fromsoftware.jp",
    "descripcion": "Estudio de Tokio que definió el subgénero soulslike con combate exigente, diseño de niveles entrelazado y narrativa ambiental.",
    "imagen": "/img/estudios/3.jpg"
  },
  {
    "id": 4,
    "nombre": "Valve Corporation",
    "pais": "Estados Unidos",
    "anio_fundacion": 1996,
    "fundador": "Gabe Newell",
    "sitio_web": "https://www.valvesoftware.com",
    "descripcion": "Creadores de Half-Life y Portal, y operadores de Steam, la mayor tienda digital de videojuegos para PC.",
    "imagen": "/img/estudios/4.jpg"
  },
  {
    "id": 5,
    "nombre": "CD Projekt Red",
    "pais": "Polonia",
    "anio_fundacion": 2002,
    "fundador": "Marcin Iwiński",
    "sitio_web": "https://www.cdprojektred.com",
    "descripcion": "Estudio de Varsovia especializado en RPG de mundo abierto con narrativa ramificada, autor de The Witcher y Cyberpunk 2077.",
    "imagen": "/img/estudios/5.jpg"
  },
  {
    "id": 6,
    "nombre": "Naughty Dog",
    "pais": "Estados Unidos",
    "anio_fundacion": 1984,
    "fundador": "Andy Gavin y Jason Rubin",
    "sitio_web": "https://www.naughtydog.com",
    "descripcion": "Estudio de Santa Mónica propiedad de Sony. Referente en narrativa cinematográfica y captura de actuación.",
    "imagen": "/img/estudios/6.jpg"
  }
];

export const plataformas = [
  {
    "id": 1,
    "nombre": "PlayStation 5",
    "fabricante": "Sony",
    "anio_lanzamiento": 2020,
    "generacion": "Novena",
    "unidades_vendidas": 75.0,
    "descripcion": "Consola de sobremesa con SSD de alta velocidad, trazado de rayos por hardware y el mando DualSense con retroalimentación háptica.",
    "imagen": "/img/plataformas/1.jpg"
  },
  {
    "id": 2,
    "nombre": "Xbox Series X",
    "fabricante": "Microsoft",
    "anio_lanzamiento": 2020,
    "generacion": "Novena",
    "unidades_vendidas": 30.0,
    "descripcion": "La consola más potente de Microsoft: 12 TFLOPS, Quick Resume y compatibilidad con cuatro generaciones de juegos Xbox.",
    "imagen": "/img/plataformas/2.png"
  },
  {
    "id": 3,
    "nombre": "Nintendo Switch",
    "fabricante": "Nintendo",
    "anio_lanzamiento": 2017,
    "generacion": "Octava",
    "unidades_vendidas": 146.0,
    "descripcion": "Consola híbrida que alterna entre modo portátil y modo televisor. Es la consola de Nintendo más vendida de la historia.",
    "imagen": "/img/plataformas/3.jpg"
  },
  {
    "id": 4,
    "nombre": "PC",
    "fabricante": "Multiplataforma",
    "anio_lanzamiento": 1985,
    "generacion": "Continua",
    "unidades_vendidas": 0.0,
    "descripcion": "Plataforma abierta y actualizable. Domina el mercado digital gracias a Steam, los mods y el hardware configurable.",
    "imagen": "/img/plataformas/4.jpg"
  },
  {
    "id": 5,
    "nombre": "PlayStation 2",
    "fabricante": "Sony",
    "anio_lanzamiento": 2000,
    "generacion": "Sexta",
    "unidades_vendidas": 160.0,
    "descripcion": "La consola más vendida de todos los tiempos. Su lector de DVD la convirtió también en el reproductor doméstico de una generación.",
    "imagen": "/img/plataformas/5.jpg"
  },
  {
    "id": 6,
    "nombre": "Nintendo 64",
    "fabricante": "Nintendo",
    "anio_lanzamiento": 1996,
    "generacion": "Quinta",
    "unidades_vendidas": 32.9,
    "descripcion": "Primera consola de Nintendo en 3D. Introdujo el stick analógico y el gatillo Z, sentando las bases del control moderno.",
    "imagen": "/img/plataformas/6.jpg"
  }
];

export const juegos = [
  {
    "id": 1,
    "titulo": "The Legend of Zelda: Breath of the Wild",
    "anio": 2017,
    "genero": "Aventura",
    "calificacion": 97,
    "precio": 59.99,
    "descripcion": "Hyrule reconstruido como un mundo abierto de exploración libre, física emergente y santuarios de ingenio.",
    "imagen": "https://media.rawg.io/media/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg",
    "estudio_id": 1,
    "plataforma_id": 3
  },
  {
    "id": 2,
    "titulo": "Super Mario Odyssey",
    "anio": 2017,
    "genero": "Plataformas",
    "calificacion": 97,
    "precio": 59.99,
    "descripcion": "Mario recorre reinos temáticos con Cappy, una gorra que le permite poseer enemigos y objetos para resolver el escenario.",
    "imagen": "https://media.rawg.io/media/games/267/267bd0dbc496f52692487d07d014c061.jpg",
    "estudio_id": 1,
    "plataforma_id": 3
  },
  {
    "id": 3,
    "titulo": "Super Mario 64",
    "anio": 1996,
    "genero": "Plataformas",
    "calificacion": 94,
    "precio": 29.99,
    "descripcion": "El salto de Mario a las tres dimensiones. Definió el control de cámara y el movimiento en los juegos 3D.",
    "imagen": "https://media.rawg.io/media/games/1d5/1d565b99cad46c44b534d9803e27bd49.jpg",
    "estudio_id": 1,
    "plataforma_id": 6
  },
  {
    "id": 4,
    "titulo": "The Legend of Zelda: Ocarina of Time",
    "anio": 1998,
    "genero": "Aventura",
    "calificacion": 99,
    "precio": 29.99,
    "descripcion": "Fijado de objetivo, viaje en el tiempo y mazmorras memorables. Sigue siendo el juego mejor valorado de la historia.",
    "imagen": "https://media.rawg.io/media/games/3a0/3a0c8e9ed3a711c542218831b893a0fa.jpg",
    "estudio_id": 1,
    "plataforma_id": 6
  },
  {
    "id": 5,
    "titulo": "Red Dead Redemption 2",
    "anio": 2018,
    "genero": "Acción-aventura",
    "calificacion": 97,
    "precio": 49.99,
    "descripcion": "Arthur Morgan y la banda de Van der Linde huyen del ocaso del salvaje oeste en un mundo de detalle obsesivo.",
    "imagen": "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    "estudio_id": 2,
    "plataforma_id": 1
  },
  {
    "id": 6,
    "titulo": "Grand Theft Auto V",
    "anio": 2013,
    "genero": "Acción",
    "calificacion": 96,
    "precio": 29.99,
    "descripcion": "Tres protagonistas, una ciudad satírica y golpes que se planifican y ejecutan cambiando de personaje en tiempo real.",
    "imagen": "https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg",
    "estudio_id": 2,
    "plataforma_id": 4
  },
  {
    "id": 7,
    "titulo": "Grand Theft Auto: San Andreas",
    "anio": 2004,
    "genero": "Acción",
    "calificacion": 95,
    "precio": 19.99,
    "descripcion": "CJ regresa a Los Santos en el mundo abierto más ambicioso de la sexta generación: tres ciudades y campo abierto.",
    "imagen": "https://media.rawg.io/media/games/960/960b601d9541cec776c5fa42a00bf6c4.jpg",
    "estudio_id": 2,
    "plataforma_id": 5
  },
  {
    "id": 8,
    "titulo": "Elden Ring",
    "anio": 2022,
    "genero": "RPG de acción",
    "calificacion": 96,
    "precio": 59.99,
    "descripcion": "Las Tierras Intermedias, escritas junto a George R. R. Martin: un soulslike de mundo abierto con exploración a caballo.",
    "imagen": "https://media.rawg.io/media/games/b29/b294fdd866dcdb643e7bab370a552855.jpg",
    "estudio_id": 3,
    "plataforma_id": 1
  },
  {
    "id": 9,
    "titulo": "Dark Souls III",
    "anio": 2016,
    "genero": "RPG de acción",
    "calificacion": 89,
    "precio": 39.99,
    "descripcion": "Combate deliberado, hogueras y una ciudad en ruinas donde cada enemigo exige leer sus animaciones antes de atacar.",
    "imagen": "https://media.rawg.io/media/games/da1/da1b267764d77221f07a4386b6548e5a.jpg",
    "estudio_id": 3,
    "plataforma_id": 2
  },
  {
    "id": 10,
    "titulo": "Bloodborne",
    "anio": 2015,
    "genero": "RPG de acción",
    "calificacion": 92,
    "precio": 19.99,
    "descripcion": "Yharnam gótica y agresiva: sin escudo, el sistema de recuperación premia contraatacar en lugar de retroceder.",
    "imagen": "https://media.rawg.io/media/games/214/214b29aeff13a0ae6a70fc4426e85991.jpg",
    "estudio_id": 3,
    "plataforma_id": 1
  },
  {
    "id": 11,
    "titulo": "Half-Life 2",
    "anio": 2004,
    "genero": "Disparos en primera persona",
    "calificacion": 96,
    "precio": 9.99,
    "descripcion": "Gordon Freeman y la pistola de gravedad en Ciudad 17. Convirtió la física en mecánica de juego y en lenguaje narrativo.",
    "imagen": "https://media.rawg.io/media/games/b8c/b8c243eaa0fbac8115e0cdccac3f91dc.jpg",
    "estudio_id": 4,
    "plataforma_id": 4
  },
  {
    "id": 12,
    "titulo": "Portal 2",
    "anio": 2011,
    "genero": "Puzles",
    "calificacion": 95,
    "precio": 9.99,
    "descripcion": "Portales, geles de propulsión y una escritura cómica excepcional en las ruinas del complejo Aperture Science.",
    "imagen": "https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg",
    "estudio_id": 4,
    "plataforma_id": 4
  },
  {
    "id": 13,
    "titulo": "Left 4 Dead 2",
    "anio": 2009,
    "genero": "Disparos cooperativo",
    "calificacion": 89,
    "precio": 9.99,
    "descripcion": "Cuatro supervivientes, hordas infinitas y un director de IA que reparte enemigos y recursos según cómo juegues.",
    "imagen": "https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg",
    "estudio_id": 4,
    "plataforma_id": 2
  },
  {
    "id": 14,
    "titulo": "The Witcher 3: Wild Hunt",
    "anio": 2015,
    "genero": "RPG",
    "calificacion": 93,
    "precio": 39.99,
    "descripcion": "Geralt de Rivia busca a Ciri en un mundo abierto donde hasta los contratos secundarios plantean dilemas morales.",
    "imagen": "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg",
    "estudio_id": 5,
    "plataforma_id": 4
  },
  {
    "id": 15,
    "titulo": "Cyberpunk 2077",
    "anio": 2020,
    "genero": "RPG",
    "calificacion": 86,
    "precio": 59.99,
    "descripcion": "Night City en primera persona: implantes, corporaciones y un fantasma digital alojado en la cabeza de V.",
    "imagen": "https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg",
    "estudio_id": 5,
    "plataforma_id": 2
  },
  {
    "id": 16,
    "titulo": "The Last of Us Part II",
    "anio": 2020,
    "genero": "Acción-aventura",
    "calificacion": 93,
    "precio": 39.99,
    "descripcion": "Una historia de venganza contada desde dos perspectivas enfrentadas, con sigilo tenso y animación facial de referencia.",
    "imagen": "https://media.rawg.io/media/games/909/909974d1c7863c2027241e265fe7011f.jpg",
    "estudio_id": 6,
    "plataforma_id": 1
  },
  {
    "id": 17,
    "titulo": "Uncharted 4: El desenlace del ladrón",
    "anio": 2016,
    "genero": "Acción-aventura",
    "calificacion": 93,
    "precio": 19.99,
    "descripcion": "Nathan Drake sale del retiro para buscar el tesoro del pirata Henry Avery junto a su hermano perdido.",
    "imagen": "https://media.rawg.io/media/games/709/709bf81f874ce5d25d625b37b014cb63.jpg",
    "estudio_id": 6,
    "plataforma_id": 1
  },
  {
    "id": 18,
    "titulo": "Jak and Daxter: El legado de los precursores",
    "anio": 2001,
    "genero": "Plataformas",
    "calificacion": 90,
    "precio": 14.99,
    "descripcion": "Plataformas 3D sin pantallas de carga: un mundo continuo que se recorre de punta a punta sin cortes.",
    "imagen": "https://media.rawg.io/media/games/c17/c17f265300a6adca4cde82562829cd92.jpg",
    "estudio_id": 6,
    "plataforma_id": 5
  }
];

