/**
 * indonesia-regions.js
 * Data dropdown berjenjang wilayah Indonesia
 * Struktur: Provinsi → Kota/Kabupaten → Kecamatan → Kode Pos
 */

const INDONESIA_REGIONS = {
  "Aceh": {
    "Kota Banda Aceh": {
      "Baiturrahman": "23116", "Banda Raya": "23234", "Kuta Alam": "23127",
      "Kuta Raja": "23156", "Lueng Bata": "23247", "Meuraxa": "23233",
      "Syiah Kuala": "23111", "Ulee Kareng": "23117", "Jaya Baru": "23155"
    },
    "Kabupaten Aceh Besar": {
      "Ingin Jaya": "23371", "Kuta Baro": "23361", "Darussalam": "23111",
      "Indrapuri": "23363", "Suka Makmur": "23374"
    },
    "Kabupaten Aceh Utara": {
      "Kuta Makmur": "24381", "Lhoksukon": "24382", "Matangkuli": "24384",
      "Sawang": "24375", "Tanah Jambo Aye": "24377"
    }
  },
  "Bali": {
    "Kota Denpasar": {
      "Denpasar Barat": "80119", "Denpasar Selatan": "80221", "Denpasar Timur": "80237",
      "Denpasar Utara": "80116"
    },
    "Kabupaten Badung": {
      "Kuta": "80361", "Kuta Selatan": "80361", "Kuta Utara": "80361",
      "Mengwi": "80351", "Abiansemal": "80352", "Petang": "80353"
    },
    "Kabupaten Gianyar": {
      "Blahbatuh": "80581", "Gianyar": "80511", "Payangan": "80572",
      "Sukawati": "80582", "Tampaksiring": "80552", "Tegallalang": "80561", "Ubud": "80571"
    },
    "Kabupaten Tabanan": {
      "Baturiti": "82191", "Kediri": "82123", "Kerambitan": "82161",
      "Marga": "82181", "Penebel": "82182", "Pupuan": "82163",
      "Selemadeg": "82162", "Tabanan": "82111"
    }
  },
  "Banten": {
    "Kota Serang": {
      "Cipocok Jaya": "42124", "Curug": "42171", "Kasemen": "42191",
      "Serang": "42111", "Taktakan": "42161", "Walantaka": "42183"
    },
    "Kota Tangerang": {
      "Batuceper": "15121", "Benda": "15125", "Cibodas": "15138",
      "Ciledug": "15153", "Cipondoh": "15148", "Karawaci": "15116",
      "Larangan": "15154", "Neglasari": "15128", "Periuk": "15131",
      "Pinang": "15144", "Tangerang": "15111"
    },
    "Kota Tangerang Selatan": {
      "Ciputat": "15411", "Ciputat Timur": "15412", "Pamulang": "15417",
      "Pondok Aren": "15224", "Serpong": "15310", "Serpong Utara": "15320"
    },
    "Kabupaten Tangerang": {
      "Balaraja": "15610", "Cisauk": "15345", "Cikupa": "15710",
      "Curug": "15810", "Kelapa Dua": "15810", "Panongan": "15710",
      "Pasar Kemis": "15560", "Tigaraksa": "15720"
    }
  },
  "Bengkulu": {
    "Kota Bengkulu": {
      "Gading Cempaka": "38225", "Kampung Melayu": "38224", "Muara Bangkahulu": "38228",
      "Ratu Agung": "38222", "Ratu Samban": "38223", "Selebar": "38213",
      "Singgaran Pati": "38226", "Sungai Serut": "38227", "Teluk Segara": "38111"
    },
    "Kabupaten Bengkulu Utara": {
      "Air Besi": "38612", "Air Padang": "38613", "Arga Makmur": "38611",
      "Batik Nau": "38617", "Enggano": "38656", "Ketahun": "38655"
    }
  },
  "DI Yogyakarta": {
    "Kota Yogyakarta": {
      "Danurejan": "55213", "Gedongtengen": "55271", "Gondokusuman": "55225",
      "Gondomanan": "55122", "Jetis": "55231", "Kotagede": "55173",
      "Kraton": "55133", "Mantrijeron": "55141", "Mergangsan": "55153",
      "Ngampilan": "55261", "Pakualaman": "55166", "Tegalrejo": "55242",
      "Umbulharjo": "55161", "Wirobrajan": "55253"
    },
    "Kabupaten Sleman": {
      "Berbah": "55573", "Cangkringan": "55583", "Depok": "55281",
      "Gamping": "55291", "Godean": "55292", "Kalasan": "55571",
      "Minggir": "55562", "Mlati": "55285", "Moyudan": "55563",
      "Ngaglik": "55581", "Ngemplak": "55584", "Pakem": "55582",
      "Prambanan": "55572", "Seyegan": "55561", "Sleman": "55511",
      "Tempel": "55552", "Turi": "55551"
    },
    "Kabupaten Bantul": {
      "Bambanglipuro": "55764", "Banguntapan": "55198", "Bantul": "55711",
      "Dlingo": "55783", "Imogiri": "55782", "Jetis": "55781",
      "Kasihan": "55181", "Kretek": "55772", "Pajangan": "55751",
      "Pandak": "55761", "Piyungan": "55792", "Pleret": "55791",
      "Pundong": "55771", "Sanden": "55763", "Sedayu": "55753",
      "Sewon": "55185", "Srandakan": "55762"
    },
    "Kabupaten Gunungkidul": {
      "Gedangsari": "55872", "Girisubo": "55883", "Karangmojo": "55893",
      "Ngawen": "55853", "Nglipar": "55871", "Panggang": "55872",
      "Patuk": "55862", "Playen": "55861", "Ponjong": "55892",
      "Purwosari": "55872", "Rongkop": "55884", "Saptosari": "55872",
      "Semanu": "55893", "Semin": "55854", "Tanjungsari": "55881",
      "Tepus": "55881", "Wonosari": "55813"
    },
    "Kabupaten Kulon Progo": {
      "Galur": "55661", "Girimulyo": "55674", "Kalibawang": "55672",
      "Kokap": "55653", "Lendah": "55663", "Nanggulan": "55671",
      "Panjatan": "55655", "Pengasih": "55652", "Samigaluh": "55673",
      "Sentolo": "55664", "Temon": "55654", "Wates": "55611"
    }
  },
  "DKI Jakarta": {
    "Jakarta Barat": {
      "Cengkareng": "11730", "Grogol Petamburan": "11450", "Kalideres": "11840",
      "Kebon Jeruk": "11530", "Kembangan": "11610", "Palmerah": "11480",
      "Tamansari": "11150", "Tambora": "11210"
    },
    "Jakarta Pusat": {
      "Cempaka Putih": "10510", "Gambir": "10110", "Johar Baru": "10560",
      "Kemayoran": "10610", "Menteng": "10310", "Sawah Besar": "10710",
      "Senen": "10410", "Tanah Abang": "10250"
    },
    "Jakarta Selatan": {
      "Cilandak": "12430", "Jagakarsa": "12620", "Kebayoran Baru": "12110",
      "Kebayoran Lama": "12240", "Mampang Prapatan": "12780", "Pancoran": "12770",
      "Pasar Minggu": "12520", "Pesanggrahan": "12320", "Setia Budi": "12910",
      "Tebet": "12810"
    },
    "Jakarta Timur": {
      "Cakung": "13910", "Cipayung": "13840", "Ciracas": "13740",
      "Duren Sawit": "13440", "Jatinegara": "13350", "Kramat Jati": "13510",
      "Makasar": "13650", "Matraman": "13150", "Pasar Rebo": "13760",
      "Pulo Gadung": "13210"
    },
    "Jakarta Utara": {
      "Cilincing": "14120", "Kelapa Gading": "14240", "Koja": "14220",
      "Pademangan": "14410", "Penjaringan": "14440", "Tanjung Priok": "14310"
    },
    "Kepulauan Seribu": {
      "Kepulauan Seribu Selatan": "14550", "Kepulauan Seribu Utara": "14550"
    }
  },
  "Gorontalo": {
    "Kota Gorontalo": {
      "Dungingi": "96133", "Hulonthalangi": "96115", "Kota Barat": "96138",
      "Kota Selatan": "96118", "Kota Tengah": "96117", "Kota Timur": "96112",
      "Kota Utara": "96113", "Sipatana": "96135"
    },
    "Kabupaten Gorontalo": {
      "Batudaa": "96251", "Bilato": "96261", "Boliyohuto": "96253",
      "Bongomeme": "96252", "Dungaliyo": "96262", "Pulubala": "96257",
      "Tibawa": "96254", "Tilango": "96255"
    }
  },
  "Jambi": {
    "Kota Jambi": {
      "Danau Sipin": "36123", "Danau Teluk": "36263", "Jambi Selatan": "36139",
      "Jambi Timur": "36142", "Jelutung": "36135", "Kota Baru": "36128",
      "Paal Merah": "36129", "Pasar Jambi": "36111", "Pelayangan": "36272",
      "Telanaipura": "36124"
    },
    "Kabupaten Muaro Jambi": {
      "Kumpeh": "36371", "Kumpeh Ulu": "36361", "Maro Sebo": "36362",
      "Mestong": "36381", "Sekernan": "36363", "Sungai Bahar": "36386"
    }
  },
  "Jawa Barat": {
    "Kota Bandung": {
      "Andir": "40181", "Antapani": "40291", "Arcamanik": "40293",
      "Astana Anyar": "40241", "Babakan Ciparay": "40222", "Bandung Kidul": "40255",
      "Bandung Kulon": "40213", "Bandung Wetan": "40114", "Batununggal": "40272",
      "Bojongloa Kaler": "40231", "Bojongloa Kidul": "40235", "Buahbatu": "40286",
      "Cibeunying Kaler": "40125", "Cibeunying Kidul": "40132", "Cicendo": "40172",
      "Cidadap": "40142", "Cimahi": "40531", "Cinambo": "40294",
      "Coblong": "40132", "Gedebage": "40295", "Kiaracondong": "40281",
      "Lengkong": "40261", "Mandalajati": "40294", "Panyileukan": "40614",
      "Rancasari": "40292", "Regol": "40251", "Sukajadi": "40163",
      "Sukasari": "40151", "Sumur Bandung": "40111", "Ujungberung": "40611"
    },
    "Kabupaten Bandung": {
      "Arjasari": "40379", "Baleendah": "40375", "Banjaran": "40377",
      "Bojongsoang": "40287", "Cangkuang": "40381", "Cimaung": "40374",
      "Cileunyi": "40625", "Cilengkrang": "40614", "Cicalengka": "40395",
      "Ciparay": "40381", "Ibun": "40384", "Katapang": "40971",
      "Kutawaringin": "40951", "Majalaya": "40382", "Margaasih": "40217",
      "Margahayu": "40228", "Nagreg": "40395", "Pameungpeuk": "40376",
      "Pacet": "40385", "Pangalengan": "40378", "Paseh": "40383",
      "Rancaekek": "40394", "Solokan Jeruk": "40387"
    },
    "Kota Bogor": {
      "Bogor Barat": "16117", "Bogor Selatan": "16136", "Bogor Tengah": "16124",
      "Bogor Timur": "16144", "Bogor Utara": "16154", "Tanah Sareal": "16161"
    },
    "Kota Bekasi": {
      "Bantar Gebang": "17310", "Bekasi Barat": "17134", "Bekasi Selatan": "17147",
      "Bekasi Timur": "17113", "Bekasi Utara": "17122", "Jatiasih": "17423",
      "Jatisampurna": "17433", "Medan Satria": "17131", "Mustika Jaya": "17157",
      "Pondok Gede": "17411", "Pondok Melati": "17414", "Rawalumbu": "17116"
    },
    "Kota Depok": {
      "Beji": "16422", "Bojongsari": "16517", "Cilodong": "16414",
      "Cimanggis": "16454", "Cinere": "16514", "Cipayung": "16437",
      "Limo": "16512", "Pancoran Mas": "16436", "Sawangan": "16511",
      "Sukmajaya": "16411", "Tapos": "16457"
    },
    "Kota Cimahi": {
      "Cimahi Selatan": "40533", "Cimahi Tengah": "40524", "Cimahi Utara": "40514"
    },
    "Kabupaten Bogor": {
      "Babakan Madang": "16810", "Bojong Gede": "16920", "Caringin": "16730",
      "Cibinong": "16913", "Cileungsi": "16820", "Ciomas": "16610",
      "Cisarua": "16750", "Dramaga": "16680", "Gunung Putri": "16961",
      "Gunung Sindur": "16340", "Jonggol": "16830", "Kemang": "16310",
      "Klapanunggal": "16820", "Parung": "16330", "Tajurhalang": "16320",
      "Ciawi": "16760"
    }
  },
  "Jawa Tengah": {
    "Kota Semarang": {
      "Banyumanik": "50261", "Candisari": "50254", "Gajah Mungkur": "50231",
      "Gayamsari": "50161", "Genuk": "50117", "Gunungpati": "50221",
      "Mijen": "50214", "Ngaliyan": "50183", "Pedurungan": "50194",
      "Semarang Barat": "50145", "Semarang Selatan": "50249", "Semarang Tengah": "50137",
      "Semarang Timur": "50125", "Semarang Utara": "50173", "Tembalang": "50272",
      "Tugu": "50182"
    },
    "Kota Surakarta": {
      "Banjarsari": "57134", "Jebres": "57128", "Laweyan": "57148",
      "Pasar Kliwon": "57156", "Serengan": "57155"
    },
    "Kota Magelang": {
      "Magelang Selatan": "56125", "Magelang Tengah": "56117", "Magelang Utara": "56115"
    },
    "Kabupaten Semarang": {
      "Ambarawa": "50611", "Bancak": "50773", "Banyubiru": "50664",
      "Bawen": "50661", "Bergas": "50552", "Bringin": "50772",
      "Getasan": "50774", "Jambu": "50663", "Pabelan": "50771",
      "Pringapus": "50553", "Sumowono": "50663", "Suruh": "50776",
      "Susukan": "50777", "Tengaran": "50775", "Tuntang": "50773",
      "Ungaran Barat": "50511", "Ungaran Timur": "50512"
    },
    "Kabupaten Klaten": {
      "Bayat": "57462", "Ceper": "57465", "Delanggu": "57471",
      "Gantiwarno": "57462", "Jatinom": "57481", "Jogonalan": "57452",
      "Kalikotes": "57453", "Karanganom": "57483", "Karangdowo": "57464",
      "Karangnongko": "57453", "Kebonarum": "57486", "Kemalang": "57461",
      "Klaten Selatan": "57421", "Klaten Tengah": "57411", "Klaten Utara": "57435",
      "Manisrenggo": "57454", "Ngawen": "57466", "Pedan": "57468",
      "Polanharjo": "57474", "Prambanan": "57454", "Trucuk": "57467",
      "Tulung": "57482", "Wedi": "57461", "Wonosari": "57473"
    }
  },
  "Jawa Timur": {
    "Kota Surabaya": {
      "Asemrowo": "60183", "Benowo": "60198", "Bubutan": "60174",
      "Bulak": "60141", "Dukuh Pakis": "60225", "Gayungan": "60235",
      "Genteng": "60275", "Gubeng": "60281", "Gunung Anyar": "60294",
      "Jambangan": "60232", "Karang Pilang": "60221", "Kenjeran": "60131",
      "Krembangan": "60175", "Lakar Santri": "60213", "Mulyorejo": "60115",
      "Pabean Cantikan": "60162", "Pakal": "60196", "Rungkut": "60293",
      "Sambikerep": "60216", "Sawahan": "60251", "Semampir": "60155",
      "Simokerto": "60141", "Sukolilo": "60111", "Sukomanunggal": "60188",
      "Tambaksari": "60135", "Tandes": "60186", "Tegalsari": "60262",
      "Tenggilis Mejoyo": "60292", "Wiyung": "60228", "Wonocolo": "60238",
      "Wonokromo": "60243"
    },
    "Kota Malang": {
      "Blimbing": "65126", "Kedungkandang": "65135", "Klojen": "65111",
      "Lowokwaru": "65141", "Sukun": "65147"
    },
    "Kabupaten Malang": {
      "Ampelgading": "65179", "Bantur": "65179", "Bululawang": "65171",
      "Dampit": "65181", "Dau": "65151", "Gedangan": "65179",
      "Gondanglegi": "65174", "Jabung": "65155", "Kalipare": "65165",
      "Karangploso": "65152", "Kepanjen": "65163", "Kromengan": "65164",
      "Lawang": "65215", "Ngajum": "65164", "Ngantang": "65156",
      "Pakis": "65154", "Pakisaji": "65162", "Pagelaran": "65174",
      "Poncokusumo": "65157", "Pujon": "65153", "Singosari": "65153",
      "Sumbermanjing Wetan": "65176", "Tajinan": "65172", "Tirtoyudo": "65178",
      "Tumpang": "65156", "Turen": "65175", "Wagir": "65162",
      "Wajak": "65177", "Wonosari": "65164"
    },
    "Kota Sidoarjo": {
      "Balung": "61219", "Balongbendo": "61262", "Buduran": "61252",
      "Candi": "61271", "Gedangan": "61254", "Jabon": "61276",
      "Krembung": "61275", "Krian": "61262", "Porong": "61274",
      "Prambon": "61275", "Sedati": "61253", "Sidoarjo": "61219",
      "Sukodono": "61258", "Taman": "61257", "Tanggulangin": "61272",
      "Tarik": "61265", "Tulangan": "61273", "Waru": "61256",
      "Wonoayu": "61261"
    }
  },
  "Kalimantan Barat": {
    "Kota Pontianak": {
      "Pontianak Barat": "78121", "Pontianak Kota": "78112", "Pontianak Selatan": "78122",
      "Pontianak Tenggara": "78115", "Pontianak Timur": "78112", "Pontianak Utara": "78243"
    },
    "Kabupaten Kubu Raya": {
      "Batu Ampar": "78991", "Kuala Mandor B": "78991", "Kubu": "78992",
      "Rasau Jaya": "78381", "Sungai Ambawang": "78391", "Sungai Kakap": "78381",
      "Sungai Raya": "78391", "Terentang": "78992"
    }
  },
  "Kalimantan Selatan": {
    "Kota Banjarmasin": {
      "Banjarmasin Barat": "70117", "Banjarmasin Selatan": "70249",
      "Banjarmasin Tengah": "70111", "Banjarmasin Timur": "70249",
      "Banjarmasin Utara": "70122"
    },
    "Kabupaten Banjar": {
      "Aluh-Aluh": "70552", "Astambul": "70683", "Beruntung Baru": "70561",
      "Gambut": "70652", "Karang Intan": "70661", "Kertak Hanyar": "70651",
      "Martapura": "70614", "Martapura Barat": "70614", "Martapura Timur": "70612",
      "Mataraman": "70682", "Simpang Empat": "70654", "Sungai Tabuk": "70652",
      "Tatah Makmur": "70651"
    }
  },
  "Kalimantan Tengah": {
    "Kota Palangka Raya": {
      "Bukit Batu": "73118", "Jekan Raya": "73112", "Pahandut": "73111",
      "Rakumpit": "73181", "Sabangau": "73115"
    },
    "Kabupaten Kotawaringin Barat": {
      "Arut Selatan": "74111", "Arut Utara": "74382", "Kotawaringin Hilir": "74213",
      "Kotawaringin Hulu": "74382", "Kumai": "74211", "Pangkalan Banteng": "74121",
      "Pangkalan Lada": "74183"
    }
  },
  "Kalimantan Timur": {
    "Kota Samarinda": {
      "Loa Janan Ilir": "75243", "Palaran": "75255", "Samarinda Ilir": "75242",
      "Samarinda Kota": "75122", "Samarinda Seberang": "75131", "Samarinda Ulu": "75124",
      "Samarinda Utara": "75117", "Sambutan": "75115", "Sungai Kunjang": "75127",
      "Sungai Pinang": "75119"
    },
    "Kota Balikpapan": {
      "Balikpapan Barat": "76113", "Balikpapan Kota": "76112", "Balikpapan Selatan": "76114",
      "Balikpapan Tengah": "76123", "Balikpapan Timur": "76127", "Balikpapan Utara": "76125"
    }
  },
  "Kalimantan Utara": {
    "Kota Tarakan": {
      "Tarakan Barat": "77117", "Tarakan Tengah": "77111",
      "Tarakan Timur": "77112", "Tarakan Utara": "77114"
    },
    "Kabupaten Bulungan": {
      "Peso": "77252", "Peso Hilir": "77253", "Tanjung Palas": "77211",
      "Tanjung Palas Barat": "77215", "Tanjung Selor": "77212"
    }
  },
  "Kepulauan Bangka Belitung": {
    "Kota Pangkal Pinang": {
      "Bukit Intan": "33684", "Gabek": "33153", "Gerunggang": "33147",
      "Girimaya": "33141", "Pangkalbalam": "33716", "Rangkui": "33134",
      "Tamansari": "33143"
    },
    "Kabupaten Bangka": {
      "Bakam": "33183", "Belinyu": "33252", "Mendo Barat": "33181",
      "Merawang": "33171", "Pemali": "33178", "Puding Besar": "33183",
      "Riau Silip": "33253", "Sungailiat": "33215", "Toboali": "33781"
    }
  },
  "Kepulauan Riau": {
    "Kota Batam": {
      "Batam Kota": "29432", "Batu Aji": "29438", "Batu Ampar": "29453",
      "Belakang Padang": "29413", "Bengkong": "29458", "Bulang": "29411",
      "Galang": "29457", "Lubuk Baja": "29442", "Nongsa": "29437",
      "Sekupang": "29441", "Sagulung": "29435"
    },
    "Kota Tanjung Pinang": {
      "Bukit Bestari": "29124", "Tanjungpinang Barat": "29115",
      "Tanjungpinang Kota": "29111", "Tanjungpinang Timur": "29125"
    }
  },
  "Lampung": {
    "Kota Bandar Lampung": {
      "Bumi Waras": "35225", "Enggal": "35114", "Kedamaian": "35152",
      "Kedaton": "35148", "Kemiling": "35153", "Labuhan Ratu": "35141",
      "Langkapura": "35154", "Panjang": "35242", "Rajabasa": "35144",
      "Sukabumi": "35125", "Sukarame": "35131", "Tanjung Karang Barat": "35137",
      "Tanjung Karang Pusat": "35117", "Tanjung Karang Timur": "35162",
      "Tanjung Senang": "35147", "Teluk Betung Barat": "35225",
      "Teluk Betung Selatan": "35211", "Teluk Betung Timur": "35214",
      "Teluk Betung Utara": "35214", "Way Halim": "35135"
    },
    "Kabupaten Lampung Selatan": {
      "Candipuro": "35355", "Jati Agung": "35363", "Katibung": "35374",
      "Kalianda": "35513", "Ketapang": "35372", "Merbau Mataram": "35361",
      "Natar": "35362", "Palas": "35374", "Penengahan": "35523",
      "Rajabasa": "35524", "Sidomulyo": "35374", "Sragi": "35374"
    }
  },
  "Maluku": {
    "Kota Ambon": {
      "Baguala": "97234", "Leitimur Selatan": "97216", "Nusaniwe": "97116",
      "Sirimau": "97126", "Teluk Ambon": "97127"
    },
    "Kabupaten Maluku Tengah": {
      "Amahai": "97511", "Banda": "97595", "Leihitu": "97582",
      "Masohi": "97512", "Salahutu": "97581", "Saparua": "97591",
      "Tehoru": "97517"
    }
  },
  "Maluku Utara": {
    "Kota Ternate": {
      "Moti": "97724", "Pulau Batang Dua": "97723", "Pulau Hiri": "97721",
      "Ternate Barat": "97715", "Ternate Selatan": "97719", "Ternate Tengah": "97716",
      "Ternate Utara": "97713"
    },
    "Kota Tidore Kepulauan": {
      "Oba": "97815", "Oba Selatan": "97817", "Oba Tengah": "97816",
      "Oba Utara": "97814", "Tidore": "97811", "Tidore Selatan": "97812",
      "Tidore Timur": "97813", "Tidore Utara": "97814"
    }
  },
  "Nusa Tenggara Barat": {
    "Kota Mataram": {
      "Ampenan": "83116", "Cakranegara": "83239", "Mataram": "83125",
      "Sandubaya": "83235", "Sekarbela": "83115", "Selaparang": "83131"
    },
    "Kabupaten Lombok Barat": {
      "Batu Layar": "83355", "Gerung": "83363", "Gunung Sari": "83351",
      "Kediri": "83362", "Kuripan": "83364", "Labuapi": "83362",
      "Lembar": "83364", "Lingsar": "83371", "Narmada": "83371",
      "Sekotong": "83365"
    },
    "Kabupaten Lombok Tengah": {
      "Batukliang": "83562", "Janapria": "83571", "Jonggat": "83561",
      "Kopang": "83562", "Praya": "83511", "Praya Barat": "83573",
      "Praya Tengah": "83561", "Pringgarata": "83563", "Pujut": "83574"
    }
  },
  "Nusa Tenggara Timur": {
    "Kota Kupang": {
      "Alak": "85116", "Kelapa Lima": "85228", "Kota Lama": "85112",
      "Kota Raja": "85111", "Maulafa": "85147", "Oebobo": "85112"
    },
    "Kabupaten Kupang": {
      "Amarasi": "85361", "Amarasi Barat": "85362", "Amarasi Selatan": "85363",
      "Kupang Tengah": "85381", "Kupang Timur": "85382", "Kupang Barat": "85383",
      "Semau": "85371", "Sulamu": "85351", "Taebenu": "85382"
    }
  },
  "Papua": {
    "Kota Jayapura": {
      "Abepura": "99351", "Heram": "99358", "Jayapura Selatan": "99224",
      "Jayapura Utara": "99111", "Muara Tami": "99354"
    },
    "Kabupaten Jayapura": {
      "Demta": "99361", "Depapre": "99362", "Ebungfauw": "99363",
      "Kemtuk": "99366", "Nimboran": "99365", "Raveni Rara": "99363",
      "Sentani": "99352", "Sentani Barat": "99353", "Sentani Timur": "99354",
      "Waibu": "99354", "Yapsi": "99368"
    }
  },
  "Papua Barat": {
    "Kota Sorong": {
      "Sorong": "98411", "Sorong Barat": "98416", "Sorong Kepulauan": "98417",
      "Sorong Manoi": "98413", "Sorong Utara": "98414"
    },
    "Kabupaten Manokwari": {
      "Manokwari Barat": "98312", "Manokwari Selatan": "98313",
      "Manokwari Timur": "98314", "Manokwari Utara": "98315",
      "Masni": "98374", "Tanah Rubu": "98375", "Warmare": "98373"
    }
  },
  "Riau": {
    "Kota Pekanbaru": {
      "Bukit Raya": "28282", "Lima Puluh": "28153", "Marpoyan Damai": "28125",
      "Payung Sekaki": "28291", "Pekanbaru Kota": "28111", "Plestraan Utara": "28297",
      "Rumbai": "28263", "Rumbai Pesisir": "28263", "Sail": "28127",
      "Senapelan": "28152", "Sukajadi": "28125", "Tampan": "28291",
      "Tenayan Raya": "28321"
    },
    "Kabupaten Kampar": {
      "Bangkinang": "28411", "Bangkinang Barat": "28471", "Bangkinang Seberang": "28413",
      "Binawidya": "28463", "Kampar": "28463", "Kampar Kiri": "28471",
      "Perhentian Raja": "28463", "Salo": "28451", "Tambang": "28411"
    }
  },
  "Sulawesi Barat": {
    "Kota Mamuju": {
      "Mamuju": "91511", "Papalang": "91513", "Simboro": "91512",
      "Tapalang": "91514", "Tapalang Barat": "91515"
    },
    "Kabupaten Mamuju": {
      "Bonehau": "91513", "Budong-Budong": "91521", "Kalukku": "91513",
      "Kalumpang": "91517", "Mamuju": "91511", "Sampaga": "91516",
      "Tobadak": "91521", "Tommo": "91516"
    }
  },
  "Sulawesi Selatan": {
    "Kota Makassar": {
      "Biringkanaya": "90244", "Bontoala": "90152", "Kepulauan Sangkarrang": "90211",
      "Mamajang": "90135", "Manggala": "90234", "Mappala": "90124",
      "Mariso": "90125", "Panakkukang": "90231", "Rappocini": "90222",
      "Tallo": "90212", "Tamalanrea": "90245", "Tamalate": "90244",
      "Ujung Pandang": "90111", "Ujung Tanah": "90151", "Wajo": "90174"
    },
    "Kabupaten Gowa": {
      "Bajeng": "92111", "Bajeng Barat": "92111", "Barombong": "92115",
      "Bontolempangan": "92166", "Bontomarannu": "92162", "Bontonompo": "92161",
      "Bontonompo Selatan": "92161", "Buakang": "92165", "Manuju": "92155",
      "Pallangga": "92114", "Parangloe": "92153", "Pattallassang": "92163",
      "Parigi": "92165", "Somba Opu": "92111", "Tinggimoncong": "92154",
      "Tombolo Pao": "92154"
    }
  },
  "Sulawesi Tengah": {
    "Kota Palu": {
      "Mantikulore": "94111", "Palu Barat": "94115", "Palu Selatan": "94111",
      "Palu Timur": "94111", "Palu Utara": "94111", "Tatanga": "94111",
      "Tawaeli": "94111", "Ulujadi": "94111"
    },
    "Kabupaten Donggala": {
      "Balaesang": "94553", "Banawa": "94551", "Banawa Selatan": "94552",
      "Banawa Tengah": "94551", "Dampelas": "94563", "Rio Pakava": "94562",
      "Sindue": "94561", "Sirenja": "94565", "Sojol": "94571", "Tanantovea": "94552"
    }
  },
  "Sulawesi Tenggara": {
    "Kota Kendari": {
      "Abeli": "93231", "Baruga": "93116", "Kambu": "93231",
      "Kadia": "93116", "Kendari": "93117", "Kendari Barat": "93112",
      "Mandonga": "93121", "Nambo": "93231", "Poasia": "93115",
      "Puuwatu": "93113", "Wua-Wua": "93116"
    },
    "Kabupaten Konawe": {
      "Pondidaha": "93471", "Sampara": "93471", "Unaaha": "93411",
      "Wawotobi": "93471", "Meluhu": "93474", "Anggaberi": "93471"
    }
  },
  "Sulawesi Utara": {
    "Kota Manado": {
      "Bunaken": "95243", "Malalayang": "95116", "Mapanget": "95147",
      "Paal Dua": "95127", "Sario": "95116", "Singkil": "95121",
      "Tikala": "95127", "Tuminting": "95232", "Wanea": "95111",
      "Wenang": "95112"
    },
    "Kota Bitung": {
      "Aertembaga": "95526", "Girian": "95543", "Lembeh Selatan": "95551",
      "Lembeh Utara": "95552", "Madidir": "95532", "Maesa": "95541",
      "Matuari": "95515", "Ranowulu": "95513"
    }
  },
  "Sumatera Barat": {
    "Kota Padang": {
      "Bungus Teluk Kabung": "25235", "Koto Tangah": "25175", "Kuranji": "25155",
      "Lubuk Begalung": "25221", "Lubuk Kilangan": "25241", "Nanggalo": "25166",
      "Padang Barat": "25117", "Padang Selatan": "25214", "Padang Timur": "25128",
      "Padang Utara": "25136", "Pauh": "25171"
    },
    "Kota Bukittinggi": {
      "Aur Birugo Tigo Baleh": "26116", "Guguk Panjang": "26112",
      "Mandiangin Koto Selayan": "26111"
    },
    "Kabupaten Agam": {
      "Ampek Angkek": "26191", "Banuhampu": "26181", "Baso": "26194",
      "Candung": "26193", "Kamang Magek": "26196", "Lubuk Basung": "26411",
      "Malalak": "26197", "Matur": "26452", "Palembayan": "26453",
      "Palupuah": "26451", "Sungai Pua": "26192", "Tanjung Mutiara": "26413",
      "Tanjung Raya": "26454", "Tilatang Kamang": "26195"
    }
  },
  "Sumatera Selatan": {
    "Kota Palembang": {
      "Alang-Alang Lebar": "30161", "Bukit Kecil": "30113", "Gandus": "30149",
      "Ilir Barat I": "30135", "Ilir Barat II": "30162", "Ilir Timur I": "30121",
      "Ilir Timur II": "30162", "Ilir Timur III": "30122", "Jakabaring": "30255",
      "Kalidoni": "30118", "Kemuning": "30153", "Kertapati": "30258",
      "Plaju": "30266", "Seberang Ulu I": "30252", "Seberang Ulu II": "30265",
      "Sematang Borang": "30166", "Sukarami": "30151"
    },
    "Kabupaten Ogan Ilir": {
      "Indralaya": "30662", "Indralaya Selatan": "30663", "Indralaya Utara": "30671",
      "Muara Kuang": "30674", "Pemulutan": "30681", "Pemulutan Barat": "30682",
      "Pemulutan Selatan": "30683", "Rantau Alai": "30673", "Rantau Panjang": "30674",
      "Tanjung Batu": "30661"
    }
  },
  "Sumatera Utara": {
    "Kota Medan": {
      "Medan Amplas": "20249", "Medan Area": "20213", "Medan Barat": "20113",
      "Medan Baru": "20151", "Medan Belawan": "20411", "Medan Denai": "20227",
      "Medan Deli": "20417", "Medan Helvetia": "20123", "Medan Johor": "20144",
      "Medan Kota": "20212", "Medan Labuhan": "20251", "Medan Maimun": "20151",
      "Medan Marelan": "20255", "Medan Perjuangan": "20232", "Medan Petisah": "20112",
      "Medan Polonia": "20157", "Medan Selayang": "20131", "Medan Sunggal": "20128",
      "Medan Tembung": "20224", "Medan Timur": "20235", "Medan Tuntungan": "20135"
    },
    "Kota Binjai": {
      "Binjai Barat": "20752", "Binjai Kota": "20712", "Binjai Selatan": "20741",
      "Binjai Timur": "20723", "Binjai Utara": "20742"
    },
    "Kabupaten Deli Serdang": {
      "Batang Kuis": "20372", "Beringin": "20552", "Deli Tua": "20356",
      "Galang": "20585", "Gunung Meriah": "20555", "Hamparan Perak": "20374",
      "Kutalimbaru": "20355", "Labuhan Deli": "20373", "Lubuk Pakam": "20512",
      "Namo Rambe": "20356", "Pagar Merbau": "20574", "Pancur Batu": "20353",
      "Pantai Labu": "20372", "Patumbak": "20151", "Percut Sei Tuan": "20371",
      "Sibolangit": "20356", "Sinembah Tanjung Muda Hilir": "20557",
      "Sunggal": "20351", "Tanjung Morawa": "20362"
    }
  },
  "Sulawesi Barat (Sulbar)": {
    "Kabupaten Polewali Mandar": {
      "Alu": "91655", "Anreapi": "91654", "Balanipa": "91653",
      "Binuang": "91653", "Bulo": "91656", "Campalagian": "91652",
      "Limboro": "91651", "Luyo": "91654", "Mapilli": "91652",
      "Matakali": "91653", "Matangnga": "91658", "Polewali": "91611",
      "Tapango": "91655", "Tinambung": "91651", "Tutar": "91656",
      "Wonomulyo": "91653"
    }
  }
};
