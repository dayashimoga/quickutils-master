/* Country Explorer - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);

// Compact country data: [name, official, capital, region, subregion, pop, area, flag, currencies, languages, tz, callingCode, tld, drivingSide]
const RAW=[
["Afghanistan","Islamic Republic of Afghanistan","Kabul","Asia","Southern Asia",38928346,652230,"🇦🇫","AFN:Afghan afghani","Pashto,Dari","UTC+4:30","+93",".af","right"],
["Albania","Republic of Albania","Tirana","Europe","Southeast Europe",2877797,28748,"🇦🇱","ALL:Albanian lek","Albanian","UTC+1","+355",".al","right"],
["Algeria","People's Democratic Republic of Algeria","Algiers","Africa","Northern Africa",43851044,2381741,"🇩🇿","DZD:Algerian dinar","Arabic","UTC+1","+213",".dz","right"],
["Argentina","Argentine Republic","Buenos Aires","Americas","South America",45195774,2780400,"🇦🇷","ARS:Argentine peso","Spanish","UTC-3","+54",".ar","right"],
["Australia","Commonwealth of Australia","Canberra","Oceania","Australia and New Zealand",25499884,7692024,"🇦🇺","AUD:Australian dollar","English","UTC+8 to UTC+11","+61",".au","left"],
["Austria","Republic of Austria","Vienna","Europe","Western Europe",9006398,83871,"🇦🇹","EUR:Euro","German","UTC+1","+43",".at","right"],
["Bangladesh","People's Republic of Bangladesh","Dhaka","Asia","Southern Asia",164689383,147570,"🇧🇩","BDT:Bangladeshi taka","Bengali","UTC+6","+880",".bd","left"],
["Belgium","Kingdom of Belgium","Brussels","Europe","Western Europe",11589623,30528,"🇧🇪","EUR:Euro","Dutch,French,German","UTC+1","+32",".be","right"],
["Brazil","Federative Republic of Brazil","Brasília","Americas","South America",212559417,8515767,"🇧🇷","BRL:Brazilian real","Portuguese","UTC-2 to UTC-5","+55",".br","right"],
["Canada","Canada","Ottawa","Americas","Northern America",38005238,9984670,"🇨🇦","CAD:Canadian dollar","English,French","UTC-3:30 to UTC-8","+1",".ca","right"],
["Chile","Republic of Chile","Santiago","Americas","South America",19116201,756102,"🇨🇱","CLP:Chilean peso","Spanish","UTC-3 to UTC-6","+56",".cl","right"],
["China","People's Republic of China","Beijing","Asia","Eastern Asia",1439323776,9596961,"🇨🇳","CNY:Chinese yuan","Mandarin","UTC+8","+86",".cn","right"],
["Colombia","Republic of Colombia","Bogotá","Americas","South America",50882891,1141748,"🇨🇴","COP:Colombian peso","Spanish","UTC-5","+57",".co","right"],
["Costa Rica","Republic of Costa Rica","San José","Americas","Central America",5094118,51100,"🇨🇷","CRC:Costa Rican colón","Spanish","UTC-6","+506",".cr","right"],
["Croatia","Republic of Croatia","Zagreb","Europe","Southeast Europe",4105267,56594,"🇭🇷","EUR:Euro","Croatian","UTC+1","+385",".hr","right"],
["Cuba","Republic of Cuba","Havana","Americas","Caribbean",11326616,109884,"🇨🇺","CUP:Cuban peso","Spanish","UTC-5","+53",".cu","right"],
["Czech Republic","Czech Republic","Prague","Europe","Central Europe",10708981,78867,"🇨🇿","CZK:Czech koruna","Czech","UTC+1","+420",".cz","right"],
["Denmark","Kingdom of Denmark","Copenhagen","Europe","Northern Europe",5792202,43094,"🇩🇰","DKK:Danish krone","Danish","UTC+1","+45",".dk","right"],
["Ecuador","Republic of Ecuador","Quito","Americas","South America",17643054,276841,"🇪🇨","USD:US Dollar","Spanish","UTC-5 to UTC-6","+593",".ec","right"],
["Egypt","Arab Republic of Egypt","Cairo","Africa","Northern Africa",102334404,1002450,"🇪🇬","EGP:Egyptian pound","Arabic","UTC+2","+20",".eg","right"],
["Ethiopia","Federal Democratic Republic of Ethiopia","Addis Ababa","Africa","Eastern Africa",114963588,1104300,"🇪🇹","ETB:Ethiopian birr","Amharic","UTC+3","+251",".et","right"],
["Finland","Republic of Finland","Helsinki","Europe","Northern Europe",5540720,338424,"🇫🇮","EUR:Euro","Finnish,Swedish","UTC+2","+358",".fi","right"],
["France","French Republic","Paris","Europe","Western Europe",65273511,640679,"🇫🇷","EUR:Euro","French","UTC+1","+33",".fr","right"],
["Germany","Federal Republic of Germany","Berlin","Europe","Western Europe",83783942,357114,"🇩🇪","EUR:Euro","German","UTC+1","+49",".de","right"],
["Ghana","Republic of Ghana","Accra","Africa","Western Africa",31072940,238533,"🇬🇭","GHS:Ghanaian cedi","English","UTC","+233",".gh","right"],
["Greece","Hellenic Republic","Athens","Europe","Southern Europe",10423054,131957,"🇬🇷","EUR:Euro","Greek","UTC+2","+30",".gr","right"],
["Hungary","Hungary","Budapest","Europe","Central Europe",9660351,93028,"🇭🇺","HUF:Hungarian forint","Hungarian","UTC+1","+36",".hu","right"],
["Iceland","Iceland","Reykjavik","Europe","Northern Europe",341243,103000,"🇮🇸","ISK:Icelandic króna","Icelandic","UTC","+354",".is","right"],
["India","Republic of India","New Delhi","Asia","Southern Asia",1380004385,3287263,"🇮🇳","INR:Indian rupee","Hindi,English","UTC+5:30","+91",".in","left"],
["Indonesia","Republic of Indonesia","Jakarta","Asia","South-Eastern Asia",273523615,1904569,"🇮🇩","IDR:Indonesian rupiah","Indonesian","UTC+7 to UTC+9","+62",".id","left"],
["Iran","Islamic Republic of Iran","Tehran","Asia","Southern Asia",83992949,1648195,"🇮🇷","IRR:Iranian rial","Persian","UTC+3:30","+98",".ir","right"],
["Iraq","Republic of Iraq","Baghdad","Asia","Western Asia",40222493,438317,"🇮🇶","IQD:Iraqi dinar","Arabic,Kurdish","UTC+3","+964",".iq","right"],
["Ireland","Republic of Ireland","Dublin","Europe","Northern Europe",4937786,70273,"🇮🇪","EUR:Euro","Irish,English","UTC","+353",".ie","left"],
["Israel","State of Israel","Jerusalem","Asia","Western Asia",8655535,20770,"🇮🇱","ILS:Israeli shekel","Hebrew,Arabic","UTC+2","+972",".il","right"],
["Italy","Italian Republic","Rome","Europe","Southern Europe",60461826,301340,"🇮🇹","EUR:Euro","Italian","UTC+1","+39",".it","right"],
["Jamaica","Jamaica","Kingston","Americas","Caribbean",2961167,10991,"🇯🇲","JMD:Jamaican dollar","English","UTC-5","+1-876",".jm","left"],
["Japan","Japan","Tokyo","Asia","Eastern Asia",126476461,377975,"🇯🇵","JPY:Japanese yen","Japanese","UTC+9","+81",".jp","left"],
["Jordan","Hashemite Kingdom of Jordan","Amman","Asia","Western Asia",10203134,89342,"🇯🇴","JOD:Jordanian dinar","Arabic","UTC+2","+962",".jo","right"],
["Kazakhstan","Republic of Kazakhstan","Nur-Sultan","Asia","Central Asia",18776707,2724900,"🇰🇿","KZT:Kazakhstani tenge","Kazakh,Russian","UTC+5 to UTC+6","+7",".kz","right"],
["Kenya","Republic of Kenya","Nairobi","Africa","Eastern Africa",53771296,580367,"🇰🇪","KES:Kenyan shilling","English,Swahili","UTC+3","+254",".ke","left"],
["Kuwait","State of Kuwait","Kuwait City","Asia","Western Asia",4270571,17818,"🇰🇼","KWD:Kuwaiti dinar","Arabic","UTC+3","+965",".kw","right"],
["Lebanon","Lebanese Republic","Beirut","Asia","Western Asia",6825445,10452,"🇱🇧","LBP:Lebanese pound","Arabic","UTC+2","+961",".lb","right"],
["Malaysia","Malaysia","Kuala Lumpur","Asia","South-Eastern Asia",32365999,330803,"🇲🇾","MYR:Malaysian ringgit","Malay","UTC+8","+60",".my","left"],
["Mexico","United Mexican States","Mexico City","Americas","Central America",128932753,1964375,"🇲🇽","MXN:Mexican peso","Spanish","UTC-5 to UTC-8","+52",".mx","right"],
["Morocco","Kingdom of Morocco","Rabat","Africa","Northern Africa",36910560,446550,"🇲🇦","MAD:Moroccan dirham","Arabic,Berber","UTC","+212",".ma","right"],
["Nepal","Federal Democratic Republic of Nepal","Kathmandu","Asia","Southern Asia",29136808,147181,"🇳🇵","NPR:Nepalese rupee","Nepali","UTC+5:45","+977",".np","left"],
["Netherlands","Kingdom of the Netherlands","Amsterdam","Europe","Western Europe",17134872,41543,"🇳🇱","EUR:Euro","Dutch","UTC+1","+31",".nl","right"],
["New Zealand","New Zealand","Wellington","Oceania","Australia and New Zealand",5084300,270467,"🇳🇿","NZD:New Zealand dollar","English,Māori","UTC+12 to UTC+13","+64",".nz","left"],
["Nigeria","Federal Republic of Nigeria","Abuja","Africa","Western Africa",206139589,923768,"🇳🇬","NGN:Nigerian naira","English","UTC+1","+234",".ng","right"],
["North Korea","Democratic People's Republic of Korea","Pyongyang","Asia","Eastern Asia",25778816,120538,"🇰🇵","KPW:North Korean won","Korean","UTC+9","+850",".kp","right"],
["Norway","Kingdom of Norway","Oslo","Europe","Northern Europe",5421241,323802,"🇳🇴","NOK:Norwegian krone","Norwegian","UTC+1","+47",".no","right"],
["Oman","Sultanate of Oman","Muscat","Asia","Western Asia",5106626,309500,"🇴🇲","OMR:Omani rial","Arabic","UTC+4","+968",".om","right"],
["Pakistan","Islamic Republic of Pakistan","Islamabad","Asia","Southern Asia",220892340,881912,"🇵🇰","PKR:Pakistani rupee","Urdu,English","UTC+5","+92",".pk","left"],
["Panama","Republic of Panama","Panama City","Americas","Central America",4314767,75417,"🇵🇦","PAB:Panamanian balboa","Spanish","UTC-5","+507",".pa","right"],
["Peru","Republic of Peru","Lima","Americas","South America",32971854,1285216,"🇵🇪","PEN:Peruvian sol","Spanish","UTC-5","+51",".pe","right"],
["Philippines","Republic of the Philippines","Manila","Asia","South-Eastern Asia",109581078,300000,"🇵🇭","PHP:Philippine peso","Filipino,English","UTC+8","+63",".ph","right"],
["Poland","Republic of Poland","Warsaw","Europe","Central Europe",37846611,312696,"🇵🇱","PLN:Polish złoty","Polish","UTC+1","+48",".pl","right"],
["Portugal","Portuguese Republic","Lisbon","Europe","Southern Europe",10196709,92090,"🇵🇹","EUR:Euro","Portuguese","UTC","+351",".pt","right"],
["Qatar","State of Qatar","Doha","Asia","Western Asia",2881053,11586,"🇶🇦","QAR:Qatari riyal","Arabic","UTC+3","+974",".qa","right"],
["Romania","Romania","Bucharest","Europe","Southeast Europe",19237691,238391,"🇷🇴","RON:Romanian leu","Romanian","UTC+2","+40",".ro","right"],
["Russia","Russian Federation","Moscow","Europe","Eastern Europe",145934462,17098242,"🇷🇺","RUB:Russian ruble","Russian","UTC+2 to UTC+12","+7",".ru","right"],
["Saudi Arabia","Kingdom of Saudi Arabia","Riyadh","Asia","Western Asia",34813871,2149690,"🇸🇦","SAR:Saudi riyal","Arabic","UTC+3","+966",".sa","right"],
["Singapore","Republic of Singapore","Singapore","Asia","South-Eastern Asia",5850342,710,"🇸🇬","SGD:Singapore dollar","English,Malay,Mandarin,Tamil","UTC+8","+65",".sg","left"],
["South Africa","Republic of South Africa","Pretoria","Africa","Southern Africa",59308690,1221037,"🇿🇦","ZAR:South African rand","Zulu,Xhosa,Afrikaans,English","UTC+2","+27",".za","left"],
["South Korea","Republic of Korea","Seoul","Asia","Eastern Asia",51269185,100210,"🇰🇷","KRW:South Korean won","Korean","UTC+9","+82",".kr","right"],
["Spain","Kingdom of Spain","Madrid","Europe","Southern Europe",46754778,505992,"🇪🇸","EUR:Euro","Spanish","UTC+1","+34",".es","right"],
["Sri Lanka","Democratic Socialist Republic of Sri Lanka","Sri Jayawardenepura Kotte","Asia","Southern Asia",21413249,65610,"🇱🇰","LKR:Sri Lankan rupee","Sinhala,Tamil","UTC+5:30","+94",".lk","left"],
["Sweden","Kingdom of Sweden","Stockholm","Europe","Northern Europe",10099265,450295,"🇸🇪","SEK:Swedish krona","Swedish","UTC+1","+46",".se","right"],
["Switzerland","Swiss Confederation","Bern","Europe","Western Europe",8654622,41284,"🇨🇭","CHF:Swiss franc","German,French,Italian,Romansh","UTC+1","+41",".ch","right"],
["Taiwan","Republic of China","Taipei","Asia","Eastern Asia",23816775,36193,"🇹🇼","TWD:New Taiwan dollar","Mandarin","UTC+8","+886",".tw","right"],
["Thailand","Kingdom of Thailand","Bangkok","Asia","South-Eastern Asia",69799978,513120,"🇹🇭","THB:Thai baht","Thai","UTC+7","+66",".th","left"],
["Turkey","Republic of Türkiye","Ankara","Asia","Western Asia",84339067,783562,"🇹🇷","TRY:Turkish lira","Turkish","UTC+3","+90",".tr","right"],
["UAE","United Arab Emirates","Abu Dhabi","Asia","Western Asia",9890402,83600,"🇦🇪","AED:UAE dirham","Arabic","UTC+4","+971",".ae","right"],
["Ukraine","Ukraine","Kyiv","Europe","Eastern Europe",44134693,603500,"🇺🇦","UAH:Ukrainian hryvnia","Ukrainian","UTC+2","+380",".ua","right"],
["United Kingdom","United Kingdom of Great Britain and Northern Ireland","London","Europe","Northern Europe",67886011,242495,"🇬🇧","GBP:Pound sterling","English","UTC","+44",".uk","left"],
["United States","United States of America","Washington, D.C.","Americas","Northern America",331002651,9833520,"🇺🇸","USD:US Dollar","English","UTC-5 to UTC-10","+1",".us","right"],
["Uruguay","Oriental Republic of Uruguay","Montevideo","Americas","South America",3473730,176215,"🇺🇾","UYU:Uruguayan peso","Spanish","UTC-3","+598",".uy","right"],
["Venezuela","Bolivarian Republic of Venezuela","Caracas","Americas","South America",28435940,916445,"🇻🇪","VES:Venezuelan bolívar","Spanish","UTC-4","+58",".ve","right"],
["Vietnam","Socialist Republic of Vietnam","Hanoi","Asia","South-Eastern Asia",97338579,331212,"🇻🇳","VND:Vietnamese đồng","Vietnamese","UTC+7","+84",".vn","right"],
["Zimbabwe","Republic of Zimbabwe","Harare","Africa","Eastern Africa",14862924,390757,"🇿🇼","ZWL:Zimbabwean dollar","English,Shona,Ndebele","UTC+2","+263",".zw","right"],
["Bolivia","Plurinational State of Bolivia","Sucre","Americas","South America",11673021,1098581,"🇧🇴","BOB:Boliviano","Spanish","UTC-4","+591",".bo","right"],
["Cameroon","Republic of Cameroon","Yaoundé","Africa","Middle Africa",26545863,475442,"🇨🇲","XAF:Central African CFA franc","French,English","UTC+1","+237",".cm","right"],
["Congo (DR)","Democratic Republic of the Congo","Kinshasa","Africa","Middle Africa",89561403,2344858,"🇨🇩","CDF:Congolese franc","French","UTC+1 to UTC+2","+243",".cd","right"],
["Czechia","Czech Republic","Prague","Europe","Central Europe",10708981,78867,"🇨🇿","CZK:Czech koruna","Czech","UTC+1","+420",".cz","right"],
["Dominican Republic","Dominican Republic","Santo Domingo","Americas","Caribbean",10847910,48671,"🇩🇴","DOP:Dominican peso","Spanish","UTC-4","+1-809",".do","right"],
["El Salvador","Republic of El Salvador","San Salvador","Americas","Central America",6486205,21041,"🇸🇻","USD:US Dollar","Spanish","UTC-6","+503",".sv","right"],
["Guatemala","Republic of Guatemala","Guatemala City","Americas","Central America",17915568,108889,"🇬🇹","GTQ:Guatemalan quetzal","Spanish","UTC-6","+502",".gt","right"],
["Honduras","Republic of Honduras","Tegucigalpa","Americas","Central America",9904607,112492,"🇭🇳","HNL:Honduran lempira","Spanish","UTC-6","+504",".hn","right"],
["Libya","State of Libya","Tripoli","Africa","Northern Africa",6871292,1759540,"🇱🇾","LYD:Libyan dinar","Arabic","UTC+2","+218",".ly","right"],
["Madagascar","Republic of Madagascar","Antananarivo","Africa","Eastern Africa",27691018,587041,"🇲🇬","MGA:Malagasy ariary","Malagasy,French","UTC+3","+261",".mg","right"],
["Mozambique","Republic of Mozambique","Maputo","Africa","Eastern Africa",31255435,801590,"🇲🇿","MZN:Mozambican metical","Portuguese","UTC+2","+258",".mz","right"],
["Myanmar","Republic of the Union of Myanmar","Naypyidaw","Asia","South-Eastern Asia",54409800,676578,"🇲🇲","MMK:Myanmar kyat","Burmese","UTC+6:30","+95",".mm","right"],
["Nicaragua","Republic of Nicaragua","Managua","Americas","Central America",6624554,130373,"🇳🇮","NIO:Nicaraguan córdoba","Spanish","UTC-6","+505",".ni","right"],
["Paraguay","Republic of Paraguay","Asunción","Americas","South America",7132538,406752,"🇵🇾","PYG:Paraguayan guaraní","Spanish,Guaraní","UTC-4","+595",".py","right"],
["Senegal","Republic of Senegal","Dakar","Africa","Western Africa",16743927,196722,"🇸🇳","XOF:West African CFA franc","French","UTC","+221",".sn","right"],
["Serbia","Republic of Serbia","Belgrade","Europe","Southeast Europe",6908224,88361,"🇷🇸","RSD:Serbian dinar","Serbian","UTC+1","+381",".rs","right"],
["Slovakia","Slovak Republic","Bratislava","Europe","Central Europe",5459642,49037,"🇸🇰","EUR:Euro","Slovak","UTC+1","+421",".sk","right"],
["Slovenia","Republic of Slovenia","Ljubljana","Europe","Southern Europe",2078654,20273,"🇸🇮","EUR:Euro","Slovene","UTC+1","+386",".si","right"],
["Somalia","Federal Republic of Somalia","Mogadishu","Africa","Eastern Africa",15893222,637657,"🇸🇴","SOS:Somali shilling","Somali,Arabic","UTC+3","+252",".so","right"],
["Sudan","Republic of the Sudan","Khartoum","Africa","Northern Africa",43849260,1886068,"🇸🇩","SDG:Sudanese pound","Arabic,English","UTC+2","+249",".sd","right"],
["Tanzania","United Republic of Tanzania","Dodoma","Africa","Eastern Africa",59734218,945087,"🇹🇿","TZS:Tanzanian shilling","Swahili,English","UTC+3","+255",".tz","left"],
["Tunisia","Republic of Tunisia","Tunis","Africa","Northern Africa",11818619,163610,"🇹🇳","TND:Tunisian dinar","Arabic","UTC+1","+216",".tn","right"],
["Uganda","Republic of Uganda","Kampala","Africa","Eastern Africa",45741007,241550,"🇺🇬","UGX:Ugandan shilling","English,Swahili","UTC+3","+256",".ug","left"],
["Uzbekistan","Republic of Uzbekistan","Tashkent","Asia","Central Asia",33469203,447400,"🇺🇿","UZS:Uzbekistani soʻm","Uzbek","UTC+5","+998",".uz","right"],
["Zambia","Republic of Zambia","Lusaka","Africa","Eastern Africa",18383955,752612,"🇿🇲","ZMW:Zambian kwacha","English","UTC+2","+260",".zm","left"],
["Portugal","Portuguese Republic","Lisbon","Europe","Southern Europe",10196709,92090,"🇵🇹","EUR:Euro","Portuguese","UTC","+351",".pt","right"],
["Bulgaria","Republic of Bulgaria","Sofia","Europe","Southeast Europe",6948445,110879,"🇧🇬","BGN:Bulgarian lev","Bulgarian","UTC+2","+359",".bg","right"],
["Lithuania","Republic of Lithuania","Vilnius","Europe","Northern Europe",2722289,65300,"🇱🇹","EUR:Euro","Lithuanian","UTC+2","+370",".lt","right"],
["Latvia","Republic of Latvia","Riga","Europe","Northern Europe",1886198,64559,"🇱🇻","EUR:Euro","Latvian","UTC+2","+371",".lv","right"],
["Estonia","Republic of Estonia","Tallinn","Europe","Northern Europe",1326535,45228,"🇪🇪","EUR:Euro","Estonian","UTC+2","+372",".ee","right"],
["Cyprus","Republic of Cyprus","Nicosia","Europe","Southern Europe",1207359,9251,"🇨🇾","EUR:Euro","Greek,Turkish","UTC+2","+357",".cy","left"],
["Luxembourg","Grand Duchy of Luxembourg","Luxembourg City","Europe","Western Europe",625978,2586,"🇱🇺","EUR:Euro","Luxembourgish,French,German","UTC+1","+352",".lu","right"],
["Malta","Republic of Malta","Valletta","Europe","Southern Europe",441543,316,"🇲🇹","EUR:Euro","Maltese,English","UTC+1","+356",".mt","left"],
["Bahrain","Kingdom of Bahrain","Manama","Asia","Western Asia",1701575,765,"🇧🇭","BHD:Bahraini dinar","Arabic","UTC+3","+973",".bh","right"],
["Maldives","Republic of Maldives","Malé","Asia","Southern Asia",540544,300,"🇲🇻","MVR:Maldivian rufiyaa","Dhivehi","UTC+5","+960",".mv","left"],
["Mongolia","Mongolia","Ulaanbaatar","Asia","Eastern Asia",3278290,1564110,"🇲🇳","MNT:Mongolian tögrög","Mongolian","UTC+8","+976",".mn","right"],
["Cambodia","Kingdom of Cambodia","Phnom Penh","Asia","South-Eastern Asia",16718965,181035,"🇰🇭","KHR:Cambodian riel","Khmer","UTC+7","+855",".kh","right"],
["Laos","Lao People's Democratic Republic","Vientiane","Asia","South-Eastern Asia",7275560,236800,"🇱🇦","LAK:Lao kip","Lao","UTC+7","+856",".la","right"],
["Angola","Republic of Angola","Luanda","Africa","Middle Africa",32866272,1246700,"🇦🇴","AOA:Angolan kwanza","Portuguese","UTC+1","+244",".ao","right"],
["Andorra","Principality of Andorra","Andorra la Vella","Europe","Southern Europe",77265,468,"🇦🇩","EUR:Euro","Catalan","UTC+1","+376",".ad","right"],
["Antigua and Barbuda","Antigua and Barbuda","St. John's","Americas","Caribbean",97929,442,"🇦🇬","XCD:East Caribbean dollar","English","UTC-4","+1-268",".ag","left"],
["Armenia","Republic of Armenia","Yerevan","Asia","Western Asia",2963243,29743,"🇦🇲","AMD:Armenian dram","Armenian","UTC+4","+374",".am","right"],
["Azerbaijan","Republic of Azerbaijan","Baku","Asia","Western Asia",10139177,86600,"🇦🇿","AZN:Azerbaijani manat","Azerbaijani","UTC+4","+994",".az","right"],
["Bahamas","Commonwealth of The Bahamas","Nassau","Americas","Caribbean",393244,13943,"🇧🇸","BSD:Bahamian dollar","English","UTC-5","+1-242",".bs","left"],
["Barbados","Barbados","Bridgetown","Americas","Caribbean",287375,430,"🇧🇧","BBD:Barbadian dollar","English","UTC-4","+1-246",".bb","left"],
["Belarus","Republic of Belarus","Minsk","Europe","Eastern Europe",9449323,207600,"🇧🇾","BYN:Belarusian ruble","Belarusian,Russian","UTC+3","+375",".by","right"],
["Belize","Belize","Belmopan","Americas","Central America",397628,22966,"🇧🇿","BZD:Belize dollar","English","UTC-6","+501",".bz","right"],
["Benin","Republic of Benin","Porto-Novo","Africa","Western Africa",12123200,112622,"🇧🇯","XOF:West African CFA franc","French","UTC+1","+229",".bj","right"],
["Bhutan","Kingdom of Bhutan","Thimphu","Asia","Southern Asia",771608,38394,"🇧🇹","BTN:Bhutanese ngultrum","Dzongkha","UTC+6","+975",".bt","left"],
["Bosnia and Herzegovina","Bosnia and Herzegovina","Sarajevo","Europe","Southeast Europe",3280819,51197,"🇧🇦","BAM:Bosnia and Herzegovina convertible mark","Bosnian,Croatian,Serbian","UTC+1","+387",".ba","right"],
["Botswana","Republic of Botswana","Gaborone","Africa","Southern Africa",2351627,581730,"🇧🇼","BWP:Botswana pula","English,Tswana","UTC+2","+267",".bw","left"],
["Brunei","Nation of Brunei","Bandar Seri Begawan","Asia","South-Eastern Asia",437479,5765,"🇧🇳","BND:Brunei dollar","Malay","UTC+8","+673",".bn","left"],
["Burkina Faso","Burkina Faso","Ouagadougou","Africa","Western Africa",20903273,272967,"🇧🇫","XOF:West African CFA franc","French","UTC","+226",".bf","right"],
["Burundi","Republic of Burundi","Gitega","Africa","Eastern Africa",11890784,27834,"🇧🇮","BIF:Burundian franc","French,Kirundi","UTC+2","+257",".bi","right"],
["Cabo Verde","Republic of Cabo Verde","Praia","Africa","Western Africa",555987,4033,"🇨🇻","CVE:Cape Verdean escudo","Portuguese","UTC-1","+238",".cv","right"],
["CAR","Central African Republic","Bangui","Africa","Middle Africa",4829767,622984,"🇨🇫","XAF:Central African CFA franc","French,Sango","UTC+1","+236",".cf","right"],
["Chad","Republic of Chad","N'Djamena","Africa","Middle Africa",16425864,1284000,"🇹🇩","XAF:Central African CFA franc","French,Arabic","UTC+1","+235",".td","right"],
["Comoros","Union of the Comoros","Moroni","Africa","Eastern Africa",869601,1862,"🇰🇲","KMF:Comorian franc","Arabic,French","UTC+3","+269",".km","right"],
["Congo","Republic of the Congo","Brazzaville","Africa","Middle Africa",5518087,342000,"🇨🇬","XAF:Central African CFA franc","French","UTC+1","+242",".cg","right"],
["Côte d'Ivoire","Republic of Côte d'Ivoire","Yamoussoukro","Africa","Western Africa",26378274,322463,"🇨🇮","XOF:West African CFA franc","French","UTC","+225",".ci","right"],
["Djibouti","Republic of Djibouti","Djibouti","Africa","Eastern Africa",988000,23200,"🇩🇯","DJF:Djiboutian franc","French,Arabic","UTC+3","+253",".dj","right"],
["Dominica","Commonwealth of Dominica","Roseau","Americas","Caribbean",71986,751,"🇩🇲","XCD:East Caribbean dollar","English","UTC-4","+1-767",".dm","left"],
["Equatorial Guinea","Republic of Equatorial Guinea","Malabo","Africa","Middle Africa",1402985,28051,"🇬🇶","XAF:Central African CFA franc","Spanish,French","UTC+1","+240",".gq","right"],
["Eritrea","State of Eritrea","Asmara","Africa","Eastern Africa",3546421,117600,"🇪🇷","ERN:Eritrean nakfa","Tigrinya,Arabic","UTC+3","+291",".er","right"],
["Eswatini","Kingdom of Eswatini","Mbabane","Africa","Southern Africa",1160164,17364,"🇸🇿","SZL:Swazi lilangeni","English,Swati","UTC+2","+268",".sz","left"],
["Fiji","Republic of Fiji","Suva","Oceania","Melanesia",896445,18272,"🇫🇯","FJD:Fijian dollar","English,Fijian,Hindi","UTC+12","+679",".fj","left"],
["Gabon","Gabonese Republic","Libreville","Africa","Middle Africa",2225734,267668,"🇬🇦","XAF:Central African CFA franc","French","UTC+1","+241",".ga","right"],
["Gambia","Republic of The Gambia","Banjul","Africa","Western Africa",2416668,11295,"🇬🇲","GMD:Gambian dalasi","English","UTC","+220",".gm","right"],
["Georgia","Georgia","Tbilisi","Asia","Western Asia",3989167,69700,"🇬🇪","GEL:Georgian lari","Georgian","UTC+4","+995",".ge","right"],
["Grenada","Grenada","St. George's","Americas","Caribbean",112523,344,"🇬🇩","XCD:East Caribbean dollar","English","UTC-4","+1-473",".gd","left"],
["Guinea","Republic of Guinea","Conakry","Africa","Western Africa",13132795,245857,"🇬🇳","GNF:Guinean franc","French","UTC","+224",".gn","right"],
["Guinea-Bissau","Republic of Guinea-Bissau","Bissau","Africa","Western Africa",1968001,36125,"🇬🇼","XOF:West African CFA franc","Portuguese","UTC","+245",".gw","right"],
["Guyana","Co-operative Republic of Guyana","Georgetown","Americas","South America",786552,214969,"🇬🇾","GYD:Guyanese dollar","English","UTC-4","+592",".gy","left"],
["Haiti","Republic of Haiti","Port-au-Prince","Americas","Caribbean",11402528,27750,"🇭🇹","HTG:Haitian gourde","French,Haitian Creole","UTC-5","+509",".ht","right"],
["Kiribati","Republic of Kiribati","Tarawa","Oceania","Micronesia",119449,811,"🇰🇮","AUD:Australian dollar","English,Gilbertese","UTC+12 to UTC+14","+686",".ki","left"],
["Kosovo","Republic of Kosovo","Pristina","Europe","Southeast Europe",1831000,10887,"🇽🇰","EUR:Euro","Albanian,Serbian","UTC+1","+383","","right"],
["Kyrgyzstan","Kyrgyz Republic","Bishkek","Asia","Central Asia",6524195,199951,"🇰🇬","KGS:Kyrgyzstani som","Kyrgyz,Russian","UTC+6","+996",".kg","right"],
["Lesotho","Kingdom of Lesotho","Maseru","Africa","Southern Africa",2142249,30355,"🇱🇸","LSL:Lesotho loti","English,Sotho","UTC+2","+266",".ls","left"],
["Liberia","Republic of Liberia","Monrovia","Africa","Western Africa",5057681,111369,"🇱🇷","LRD:Liberian dollar","English","UTC","+231",".lr","right"],
["Liechtenstein","Principality of Liechtenstein","Vaduz","Europe","Western Europe",38128,160,"🇱🇮","CHF:Swiss franc","German","UTC+1","+423",".li","right"],
["Malawi","Republic of Malawi","Lilongwe","Africa","Eastern Africa",19129952,118484,"🇲🇼","MWK:Malawian kwacha","English,Chewa","UTC+2","+265",".mw","left"],
["Mali","Republic of Mali","Bamako","Africa","Western Africa",20250833,1240192,"🇲🇱","XOF:West African CFA franc","French","UTC","+223",".ml","right"],
["Marshall Islands","Republic of the Marshall Islands","Majuro","Oceania","Micronesia",59190,181,"🇲🇭","USD:US Dollar","Marshallese,English","UTC+12","+692",".mh","right"],
["Mauritania","Islamic Republic of Mauritania","Nouakchott","Africa","Western Africa",4649658,1030700,"🇲🇷","MRU:Mauritanian ouguiya","Arabic","UTC","+222",".mr","right"],
["Mauritius","Republic of Mauritius","Port Louis","Africa","Eastern Africa",1271768,2040,"🇲🇺","MUR:Mauritian rupee","English,French,Creole","UTC+4","+230",".mu","left"],
["Micronesia","Federated States of Micronesia","Palikir","Oceania","Micronesia",115023,702,"🇫🇲","USD:US Dollar","English","UTC+10 to UTC+11","+691",".fm","right"],
["Moldova","Republic of Moldova","Chișinău","Europe","Eastern Europe",2657637,33846,"🇲🇩","MDL:Moldovan leu","Romanian","UTC+2","+373",".md","right"],
["Monaco","Principality of Monaco","Monaco","Europe","Western Europe",39242,2,"🇲🇨","EUR:Euro","French","UTC+1","+377",".mc","right"],
["Montenegro","Montenegro","Podgorica","Europe","Southeast Europe",628066,13812,"🇲🇪","EUR:Euro","Montenegrin","UTC+1","+382",".me","right"],
["Namibia","Republic of Namibia","Windhoek","Africa","Southern Africa",2540905,825615,"🇳🇦","NAD:Namibian dollar","English","UTC+2","+264",".na","left"],
["Nauru","Republic of Nauru","Yaren","Oceania","Micronesia",10824,21,"🇳🇷","AUD:Australian dollar","English,Nauruan","UTC+12","+674",".nr","left"],
["Niger","Republic of the Niger","Niamey","Africa","Western Africa",24206644,1267000,"🇳🇪","XOF:West African CFA franc","French","UTC+1","+227",".ne","right"],
["North Macedonia","Republic of North Macedonia","Skopje","Europe","Southeast Europe",2083374,25713,"🇲🇰","MKD:Macedonian denar","Macedonian","UTC+1","+389",".mk","right"],
["Palau","Republic of Palau","Ngerulmud","Oceania","Micronesia",18094,459,"🇵🇼","USD:US Dollar","Palauan,English","UTC+9","+680",".pw","right"],
["Papua New Guinea","Independent State of Papua New Guinea","Port Moresby","Oceania","Melanesia",8947024,462840,"🇵🇬","PGK:Papua New Guinean kina","English,Tok Pisin","UTC+10","+675",".pg","left"],
["Rwanda","Republic of Rwanda","Kigali","Africa","Eastern Africa",12952218,26338,"🇷🇼","RWF:Rwandan franc","Kinyarwanda,French,English","UTC+2","+250",".rw","right"],
["Saint Kitts and Nevis","Federation of Saint Kitts and Nevis","Basseterre","Americas","Caribbean",53199,261,"🇰🇳","XCD:East Caribbean dollar","English","UTC-4","+1-869",".kn","left"],
["Saint Lucia","Saint Lucia","Castries","Americas","Caribbean",183627,616,"🇱🇨","XCD:East Caribbean dollar","English","UTC-4","+1-758",".lc","left"],
["Saint Vincent","Saint Vincent and the Grenadines","Kingstown","Americas","Caribbean",110940,389,"🇻🇨","XCD:East Caribbean dollar","English","UTC-4","+1-784",".vc","left"],
["Samoa","Independent State of Samoa","Apia","Oceania","Polynesia",198414,2842,"🇼🇸","WST:Samoan tālā","Samoan,English","UTC+13","+685",".ws","left"],
["San Marino","Republic of San Marino","San Marino","Europe","Southern Europe",33931,61,"🇸🇲","EUR:Euro","Italian","UTC+1","+378",".sm","right"],
["São Tomé and Príncipe","São Tomé and Príncipe","São Tomé","Africa","Middle Africa",219159,964,"🇸🇹","STN:São Tomé and Príncipe dobra","Portuguese","UTC","+239",".st","right"],
["Seychelles","Republic of Seychelles","Victoria","Africa","Eastern Africa",98347,455,"🇸🇨","SCR:Seychellois rupee","English,French,Creole","UTC+4","+248",".sc","left"],
["Sierra Leone","Republic of Sierra Leone","Freetown","Africa","Western Africa",7976983,71740,"🇸🇱","SLE:Sierra Leonean leone","English","UTC","+232",".sl","right"],
["Solomon Islands","Solomon Islands","Honiara","Oceania","Melanesia",686884,28896,"🇸🇧","SBD:Solomon Islands dollar","English","UTC+11","+677",".sb","left"],
["South Sudan","Republic of South Sudan","Juba","Africa","Eastern Africa",11193725,619745,"🇸🇸","SSP:South Sudanese pound","English","UTC+2","+211",".ss","right"],
["Suriname","Republic of Suriname","Paramaribo","Americas","South America",586632,163820,"🇸🇷","SRD:Surinamese dollar","Dutch","UTC-3","+597",".sr","left"],
["Syria","Syrian Arab Republic","Damascus","Asia","Western Asia",17500658,185180,"🇸🇾","SYP:Syrian pound","Arabic","UTC+2","+963",".sy","right"],
["Tajikistan","Republic of Tajikistan","Dushanbe","Asia","Central Asia",9537645,143100,"🇹🇯","TJS:Tajikistani somoni","Tajik","UTC+5","+992",".tj","right"],
["Timor-Leste","Democratic Republic of Timor-Leste","Dili","Asia","South-Eastern Asia",1318445,14874,"🇹🇱","USD:US Dollar","Portuguese,Tetum","UTC+9","+670",".tl","left"],
["Togo","Togolese Republic","Lomé","Africa","Western Africa",8278724,56785,"🇹🇬","XOF:West African CFA franc","French","UTC","+228",".tg","right"],
["Tonga","Kingdom of Tonga","Nukuʻalofa","Oceania","Polynesia",105695,747,"🇹🇴","TOP:Tongan paʻanga","English,Tongan","UTC+13","+676",".to","left"],
["Trinidad and Tobago","Republic of Trinidad and Tobago","Port of Spain","Americas","Caribbean",1399488,5130,"🇹🇹","TTD:Trinidad and Tobago dollar","English","UTC-4","+1-868",".tt","left"],
["Turkmenistan","Turkmenistan","Ashgabat","Asia","Central Asia",6031200,488100,"🇹🇲","TMT:Turkmenistan manat","Turkmen","UTC+5","+993",".tm","right"],
["Tuvalu","Tuvalu","Funafuti","Oceania","Polynesia",11792,26,"🇹🇻","AUD:Australian dollar","English,Tuvaluan","UTC+12","+688",".tv","left"],
["Vanuatu","Republic of Vanuatu","Port Vila","Oceania","Melanesia",307145,12189,"🇻🇺","VUV:Vanuatu vatu","English,French,Bislama","UTC+11","+678",".vu","right"],
["Vatican City","Vatican City State","Vatican City","Europe","Southern Europe",801,0.44,"🇻🇦","EUR:Euro","Italian,Latin","UTC+1","+39",".va","right"],
["Yemen","Republic of Yemen","Sana'a","Asia","Western Asia",29825964,527968,"🇾🇪","YER:Yemeni rial","Arabic","UTC+3","+967",".ye","right"],
];

// Parse to objects
const TLD_MAP={uk:'gb'};
function tldCode(tld){const c=tld.replace('.','');return TLD_MAP[c]||c;}
const COUNTRIES = RAW.map(r=>({
  name:r[0],official:r[1],capital:r[2],region:r[3],subregion:r[4],
  population:r[5],area:r[6],flag:r[7],
  currencies:r[8],languages:r[9],timezones:r[10],
  callingCode:r[11],tld:r[12],drivingSide:r[13],
  code:tldCode(r[12]),
  density:r[6]>0?Math.round(r[5]/r[6]):0
}));

// Remove duplicates
const seen=new Set();
const countries=COUNTRIES.filter(c=>{if(seen.has(c.name))return false;seen.add(c.name);return true;});

let filtered=[...countries];
let favorites=JSON.parse(localStorage.getItem('qu_fav_countries')||'[]');

function fmt(n){return n?n.toLocaleString():'N/A';}
function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';}

function renderCountries(){
  const search=$('#searchInput').value.toLowerCase();
  const region=$('#regionFilter').value;
  const sort=$('#sortBy').value;
  filtered=countries.filter(c=>{
    if(region&&c.region!==region)return false;
    if(search){
      return c.name.toLowerCase().includes(search)||c.capital.toLowerCase().includes(search)||
        c.currencies.toLowerCase().includes(search)||c.languages.toLowerCase().includes(search);
    }
    return true;
  });
  if(sort==='population')filtered.sort((a,b)=>b.population-a.population);
  else if(sort==='area')filtered.sort((a,b)=>b.area-a.area);
  else if(sort==='density')filtered.sort((a,b)=>b.density-a.density);
  else filtered.sort((a,b)=>a.name.localeCompare(b.name));

  $('#countDisplay').textContent=filtered.length+' countries';
  $('#countriesGrid').innerHTML=filtered.map(c=>{
    const isFav=favorites.includes(c.name);
    const cur=c.currencies.split(':');
    return `<div class="country-card" data-name="${esc(c.name)}">
      <div class="country-flag"><img src="https://flagcdn.com/w160/${c.code}.png" alt="${esc(c.name)}" loading="lazy" onerror="this.outerHTML='${c.flag}'"></div>
      <div class="country-info">
        <div class="country-name">${esc(c.name)} ${isFav?'⭐':''}</div>
        <div class="country-detail-row"><span class="label">Capital</span><span class="value">${esc(c.capital)}</span></div>
        <div class="country-detail-row"><span class="label">Population</span><span class="value">${fmt(c.population)}</span></div>
        <div class="country-detail-row"><span class="label">Currency</span><span class="value">${cur[0]}</span></div>
        <div class="country-badges"><span class="badge">${c.region}</span><span class="badge">${c.subregion}</span></div>
      </div>
    </div>`;
  }).join('');

  $$('.country-card').forEach(card=>card.addEventListener('click',()=>showDetail(card.dataset.name)));
}

function showDetail(name){
  const c=countries.find(x=>x.name===name);if(!c)return;
  const isFav=favorites.includes(c.name);
  const cur=c.currencies.split(':');
  const modal=$('#detailModal');
  $('#detailContent').innerHTML=`
    <div class="modal-header"><h2>${c.flag} ${esc(c.name)}</h2><button class="icon-btn" onclick="document.getElementById('detailModal').classList.remove('active')">✕</button></div>
    <div class="detail-header"><div class="detail-flag"><img src="https://flagcdn.com/w320/${c.code}.png" alt="${esc(c.name)}" style="width:80px;border-radius:8px;box-shadow:var(--shadow-md)" onerror="this.outerHTML='<span style=\\'font-size:4rem\\'>${c.flag}</span>'"></div><div class="detail-title"><h1>${esc(c.name)}</h1><div class="subtitle">${esc(c.official)}</div><button class="btn btn-sm ${isFav?'btn-primary':'btn-secondary'}" id="favBtn">${isFav?'⭐ Favorited':'☆ Add Favorite'}</button></div></div>
    <div class="detail-grid">
      <div class="detail-item"><div class="di-label">Capital</div><div class="di-value">${esc(c.capital)}</div></div>
      <div class="detail-item"><div class="di-label">Region</div><div class="di-value">${c.region} — ${c.subregion}</div></div>
      <div class="detail-item"><div class="di-label">Population</div><div class="di-value">${fmt(c.population)}</div></div>
      <div class="detail-item"><div class="di-label">Area</div><div class="di-value">${fmt(c.area)} km²</div></div>
      <div class="detail-item"><div class="di-label">Density</div><div class="di-value">${c.density} /km²</div></div>
      <div class="detail-item"><div class="di-label">Currency</div><div class="di-value">${cur.length>1?cur[1]+' ('+cur[0]+')':cur[0]}</div></div>
      <div class="detail-item"><div class="di-label">Languages</div><div class="di-value">${esc(c.languages)}</div></div>
      <div class="detail-item"><div class="di-label">Time Zones</div><div class="di-value">${esc(c.timezones)}</div></div>
      <div class="detail-item"><div class="di-label">Calling Code</div><div class="di-value">${esc(c.callingCode)}</div></div>
      <div class="detail-item"><div class="di-label">TLD</div><div class="di-value">${esc(c.tld)}</div></div>
      <div class="detail-item"><div class="di-label">Driving Side</div><div class="di-value">${c.drivingSide}</div></div>
    </div>`;
  modal.classList.add('active');
  $('#favBtn').addEventListener('click',()=>{
    if(favorites.includes(c.name))favorites=favorites.filter(f=>f!==c.name);
    else favorites.push(c.name);
    localStorage.setItem('qu_fav_countries',JSON.stringify(favorites));
    showDetail(name);renderCountries();
  });
}

// Compare
$('#compareBtn').addEventListener('click',()=>{
  const sel=countries.map(c=>`<option value="${c.name}">${c.flag} ${c.name}</option>`).join('');
  $('#compare1').innerHTML=sel;$('#compare2').innerHTML=sel;
  if(countries.length>1)$('#compare2').selectedIndex=1;
  $('#compareModal').classList.add('active');
});
$('#closeCompare').addEventListener('click',()=>$('#compareModal').classList.remove('active'));
$('#doCompare').addEventListener('click',()=>{
  const a=countries.find(c=>c.name===$('#compare1').value);
  const b=countries.find(c=>c.name===$('#compare2').value);
  if(!a||!b)return;
  const rows=[['Flag',a.flag,b.flag],['Capital',a.capital,b.capital],['Region',a.region,b.region],
    ['Population',fmt(a.population),fmt(b.population)],['Area',fmt(a.area)+' km²',fmt(b.area)+' km²'],
    ['Density',a.density+'/km²',b.density+'/km²'],['Currency',a.currencies,b.currencies],
    ['Languages',a.languages,b.languages],['Driving',a.drivingSide,b.drivingSide]];
  $('#compareResults').innerHTML=`<div style="display:flex; flex-direction:column; gap:20px;">
    <div style="height: 250px; width: 100%;"><canvas id="compareChart"></canvas></div>
    <table class="compare-table"><thead><tr><th>Metric</th><th>${a.flag} ${a.name}</th><th>${b.flag} ${b.name}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
  </div>`;
  
  if (window.compareChartInst) window.compareChartInst.destroy();
  const ctx = document.getElementById('compareChart').getContext('2d');
  
  // Normalize data for chart so bars are visible even with huge differences
  // We'll chart log10 values or just use multiple scales
  window.compareChartInst = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['Population (Log)', 'Area km² (Log)', 'Density /km²'],
          datasets: [{
              label: a.name,
              data: [Math.log10(a.population || 1), Math.log10(a.area || 1), a.density],
              backgroundColor: 'rgba(99, 102, 241, 0.7)',
              borderColor: 'rgba(99, 102, 241, 1)',
              borderWidth: 1
          }, {
              label: b.name,
              data: [Math.log10(b.population || 1), Math.log10(b.area || 1), b.density],
              backgroundColor: 'rgba(236, 72, 153, 0.7)',
              borderColor: 'rgba(236, 72, 153, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: { labels: { color: '#fff' } },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    // Restore true value for tooltip
                    if (context.dataIndex === 0) {
                      label += fmt(context.datasetIndex === 0 ? a.population : b.population);
                    } else if (context.dataIndex === 1) {
                      label += fmt(context.datasetIndex === 0 ? a.area : b.area) + ' km²';
                    } else {
                      label += (context.datasetIndex === 0 ? a.density : b.density) + ' /km²';
                    }
                    return label;
                  }
                }
              }
          },
          scales: {
              y: { ticks: { color: '#aaa', callback: function() { return ''; } }, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.1)' } }
          }
      }
  });
});

// Quiz
let quizScore=0,quizTotal=0,quizCountry=null;
$('#quizBtn').addEventListener('click',()=>{$('#quizModal').classList.add('active');nextQuiz();});
$('#closeQuiz').addEventListener('click',()=>$('#quizModal').classList.remove('active'));
function nextQuiz(){
  const types=['flag','capital','population'];
  const type=types[Math.floor(Math.random()*types.length)];
  quizCountry=countries[Math.floor(Math.random()*countries.length)];
  const opts=[quizCountry];
  while(opts.length<4){const r=countries[Math.floor(Math.random()*countries.length)];if(!opts.includes(r))opts.push(r);}
  opts.sort(()=>Math.random()-0.5);
  let q='',choices='';
  if(type==='flag'){
    q=`Which country has this flag?<div class="quiz-flag">${quizCountry.flag}</div>`;
    choices=opts.map(o=>`<button class="quiz-option" data-ans="${o.name}">${o.name}</button>`).join('');
  } else if(type==='capital'){
    q=`What is the capital of <strong>${quizCountry.name}</strong>?`;
    choices=opts.map(o=>`<button class="quiz-option" data-ans="${o.capital}">${o.capital}</button>`).join('');
  } else {
    q=`Which country has the largest population?`;
    const sorted=[...opts].sort((a,b)=>b.population-a.population);
    quizCountry=sorted[0];
    choices=opts.map(o=>`<button class="quiz-option" data-ans="${o.name}">${o.flag} ${o.name} </button>`).join('');
  }
  $('#quizArea').innerHTML=`<div class="quiz-question">${q}</div><div class="quiz-options">${choices}</div><div class="quiz-score">Score: ${quizScore}/${quizTotal}</div>`;
  $$('.quiz-option').forEach(b=>b.addEventListener('click',()=>{
    quizTotal++;
    const correct=type==='capital'?quizCountry.capital:quizCountry.name;
    if(b.dataset.ans===correct){b.classList.add('correct');quizScore++;}
    else{b.classList.add('wrong');$$('.quiz-option').forEach(x=>{if(x.dataset.ans===correct)x.classList.add('correct');});}
    setTimeout(nextQuiz,1200);
  }));
}

// Stats
$('#statsBtn').addEventListener('click',()=>{
  const byPop=[...countries].sort((a,b)=>b.population-a.population).slice(0,10);
  const byArea=[...countries].sort((a,b)=>b.area-a.area).slice(0,10);
  const maxPop=byPop[0].population, maxArea=byArea[0].area;
  let html='<h3>Top 10 by Population</h3>';
  byPop.forEach(c=>{const pct=(c.population/maxPop*100).toFixed(1);
    html+=`<div class="stat-bar-container"><div class="stat-bar-label"><span>${c.flag} ${c.name}</span><span>${fmt(c.population)}</span></div><div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div></div>`;});
  html+='<h3 style="margin-top:1.5rem">Top 10 by Area</h3>';
  byArea.forEach(c=>{const pct=(c.area/maxArea*100).toFixed(1);
    html+=`<div class="stat-bar-container"><div class="stat-bar-label"><span>${c.flag} ${c.name}</span><span>${fmt(c.area)} km²</span></div><div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div></div>`;});
  $('#statsArea').innerHTML=html;
  $('#statsModal').classList.add('active');
});
$('#closeStats').addEventListener('click',()=>$('#statsModal').classList.remove('active'));

// Modal close on overlay click
$$('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active');}));

// Events
$('#searchInput').addEventListener('input',renderCountries);
$('#regionFilter').addEventListener('change',renderCountries);
$('#sortBy').addEventListener('change',renderCountries);

renderCountries();

// ── Interactive World Map ──
const mapBtn=$('#mapBtn');
if(mapBtn) mapBtn.addEventListener('click',()=>{
  $('#mapModal').classList.add('active');
  setTimeout(renderWorldMap,100);
});
const closeMap=$('#closeMap');
if(closeMap) closeMap.addEventListener('click',()=>$('#mapModal').classList.remove('active'));

function renderWorldMap(){
  const cvs=$('#worldMapCanvas');if(!cvs)return;
  const mapContainer=cvs.parentElement;
  
  if(cvs.dataset.rendered) return; // Already rendered
  cvs.dataset.rendered = 'true';
  $('#mapInfo').innerHTML = '<div style="color:var(--text-muted);">Fetching Global Topology...</div>';

  let width = mapContainer.clientWidth;
  let height = mapContainer.clientHeight;
  cvs.width = width;  cvs.height = height;
  const ctx = cvs.getContext('2d');

  const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.1)
      .translate([width / 2, height / 2])
      .precision(0.1);

  const path = d3.geoPath().projection(projection).context(ctx);

  let worldData = null, land = null, borders = null, countryFeatures = [];
  let rotation = [0, -15, 0];
  let isDragging = false, dragStart = null, rotStart = null;
  let hoveredFeature = null;
  let autoRotate = true;

  d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(world => {
      worldData = world;
      countryFeatures = topojson.feature(world, world.objects.countries).features;
      // Precompute centroids
      countryFeatures.forEach(f => { f.centroid = d3.geoCentroid(f); });
      borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
      $('#mapInfo').innerHTML = 'Drag to rotate. Hover to inspect countries. Scroll to zoom.';
      startGlobe();
  }).catch(()=>{
      $('#mapInfo').innerHTML = '<div style="color:red">Failed to load map data.</div>';
  });

  window.addEventListener('resize', () => {
      if(mapContainer.clientWidth === 0) return;
      width = mapContainer.clientWidth;
      height = mapContainer.clientHeight;
      cvs.width = width; cvs.height = height;
      projection.translate([width / 2, height / 2]);
  });

  cvs.addEventListener('mousedown', e => {
      isDragging = true;
      autoRotate = false; // Stop spinning when user interacts!
      dragStart = [e.clientX, e.clientY];
      rotStart = [...rotation];
      cvs.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => { isDragging = false; cvs.style.cursor = hoveredFeature ? 'pointer' : 'grab'; });
  
  cvs.addEventListener('mousemove', e => {
      if(isDragging) {
          const dx = e.clientX - dragStart[0];
          const dy = e.clientY - dragStart[1];
          rotation[0] = rotStart[0] + dx * 0.4;
          rotation[1] = Math.max(-90, Math.min(90, rotStart[1] - dy * 0.4));
      } else {
          // Identify hovered country
          const pos = [e.offsetX, e.offsetY];
          const coord = projection.invert(pos);
          let found = null;
          if (coord) {
              found = countryFeatures.find(f => d3.geoContains(f, coord));
          }
          if(found !== hoveredFeature) {
              hoveredFeature = found;
              cvs.style.cursor = found ? 'pointer' : 'grab';
              if(found) {
                  let cObj = countries.find(c => c.name === found.properties.name || c.name.includes(found.properties.name));
                  if(cObj) {
                      $('#mapInfo').innerHTML = `<img src="https://flagcdn.com/w40/${cObj.code}.png" style="height:24px;vertical-align:middle;border-radius:2px" onerror="this.outerHTML='${cObj.flag}'"> <strong style="color:var(--primary);font-size:1.2em">${cObj.name}</strong> — Capital: ${cObj.capital} | Pop: ${fmt(cObj.population)} | ${cObj.region}`;
                  } else {
                      $('#mapInfo').innerHTML = `<strong style="color:#aaa">${found.properties.name}</strong>`;
                  }
              } else {
                  $('#mapInfo').innerHTML = 'Drag to rotate. Hover to inspect countries. Scroll to zoom.';
              }
          }
      }
  });

  cvs.addEventListener('click', () => {
      if(hoveredFeature) {
          let cObj = countries.find(c => c.name === hoveredFeature.properties.name || c.name.includes(hoveredFeature.properties.name));
          if(cObj) showDetail(cObj.name);
      }
  });

  cvs.addEventListener('wheel', e => {
      e.preventDefault();
      const sc = projection.scale();
      projection.scale(Math.max(100, Math.min(8000, sc - e.deltaY * 1.5))); // Increased zoom limit
  });

  function startGlobe() {
      requestAnimationFrame(draw);
  }

  function draw() {
      if(autoRotate && !isDragging) rotation[0] += 0.15;
      projection.rotate(rotation);

      ctx.clearRect(0, 0, width, height);

      // Ocean layer
      ctx.beginPath();
      path({type: "Sphere"});
      ctx.fillStyle = '#0f172a'; // Deep blue ocean
      ctx.fill();

      // Landmasses
      for(let feature of countryFeatures) {
          ctx.beginPath();
          path(feature);
          
          let cObj = countries.find(c => c.name === feature.properties.name || c.name.includes(feature.properties.name));
          let fl = '#1e293b'; // Default land
          
          // Region coloring
          if(cObj) {
              const rc = { Africa:'#b45309', Americas:'#047857', Asia:'#b91c1c', Europe:'#1d4ed8', Oceania:'#5b21b6' };
              fl = rc[cObj.region] || fl;
          }
          
          if(feature === hoveredFeature) {
              ctx.fillStyle = '#fde047'; // Bright yellow hover
          } else {
              ctx.fillStyle = fl;
          }
          
          ctx.fill();
      }

      // Borders
      if(borders) {
          ctx.beginPath();
          path(borders);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
      }
      
      // Labels
      const center = projection.invert([width/2, height/2]);
      const currentScale = projection.scale();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for(let feature of countryFeatures) {
          // Label only if centroid is on the visible front hemisphere (distance < 90 degrees/pi/2)
          if(d3.geoDistance(feature.centroid, center) < Math.PI/2) {
              const [x, y] = projection(feature.centroid);
              
              // Only draw labels if zoom is high enough OR country is physically large
              // We estimate physical size using spherical area
              const area = d3.geoArea(feature);
              
              if(currentScale > 1000 || area > 0.05) {
                  let cObj = countries.find(c => c.name === feature.properties.name || c.name.includes(feature.properties.name));
                  let label = cObj ? cObj.name : feature.properties.name;
                  
                  ctx.font = area > 0.1 ? '14px sans-serif' : '10px sans-serif';
                  ctx.fillStyle = '#fff';
                  ctx.shadowColor = 'rgba(0,0,0,0.8)';
                  ctx.shadowBlur = 4;
                  ctx.fillText(label, x, y);
                  ctx.shadowBlur = 0; // reset
              }
          }
      }

      // Atmospheric glowing rim
      ctx.beginPath();
      path({type: "Sphere"});
      const grad = ctx.createRadialGradient(width/2, height/2, projection.scale()*0.85, width/2, height/2, projection.scale());
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.5)'); // Cyan glow
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      requestAnimationFrame(draw);
  }
}

// ── Export Functionality ──
const exportDataBtn=$('#exportDataBtn');
if(exportDataBtn) exportDataBtn.addEventListener('click',()=>$('#exportModal').classList.add('active'));
const closeExport=$('#closeExport');
if(closeExport) closeExport.addEventListener('click',()=>$('#exportModal').classList.remove('active'));

// CSV Export
const csvBtn=$('#exportCSVBtn');
if(csvBtn) csvBtn.addEventListener('click',()=>{
  const header='Name,Capital,Region,Subregion,Population,Area,Currency,Languages,Calling Code,TLD,Driving Side\n';
  const rows=filtered.map(c=>`"${c.name}","${c.capital}","${c.region}","${c.subregion}",${c.population},${c.area},"${c.currencies}","${c.languages}","${c.callingCode}","${c.tld}","${c.drivingSide}"`).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='countries-export.csv';a.click();
});

// Print PDF
const printBtn=$('#exportPrintBtn');
if(printBtn) printBtn.addEventListener('click',()=>{
  const rows=filtered.map(c=>`<tr><td>${c.flag}</td><td>${c.name}</td><td>${c.capital}</td><td>${c.region}</td><td>${fmt(c.population)}</td><td>${c.currencies.split(':')[0]}</td><td>${c.languages}</td></tr>`).join('');
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Country Data Export</title><style>@page{size:A4 landscape;margin:1cm}body{font-family:sans-serif;margin:0;padding:1rem}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}th{background:#6366f1;color:#fff}tr:nth-child(even){background:#f5f5f5}h1{font-size:16px;margin-bottom:8px}</style></head><body><h1>Country Explorer — ${filtered.length} Countries</h1><table><thead><tr><th>Flag</th><th>Name</th><th>Capital</th><th>Region</th><th>Population</th><th>Currency</th><th>Languages</th></tr></thead><tbody>${rows}</tbody></table><script>setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`);
  win.document.close();
});

// PNG Card Export
const cardBtn=$('#exportCardBtn');
if(cardBtn) cardBtn.addEventListener('click',()=>{
  const cvs=document.createElement('canvas');cvs.width=800;cvs.height=Math.min(filtered.length*28+80,3000);
  const ctx=cvs.getContext('2d');
  ctx.fillStyle='#0f0f1a';ctx.fillRect(0,0,cvs.width,cvs.height);
  ctx.fillStyle='#6366f1';ctx.font='bold 20px sans-serif';ctx.fillText(`Country Explorer — ${filtered.length} Countries`,20,35);
  ctx.fillStyle='#9ca3af';ctx.font='12px sans-serif';ctx.fillText('Name | Capital | Currency | Population',20,60);
  ctx.strokeStyle='#333';ctx.beginPath();ctx.moveTo(20,70);ctx.lineTo(780,70);ctx.stroke();
  filtered.slice(0,100).forEach((c,i)=>{
    const y=80+i*28;
    ctx.fillStyle=i%2===0?'rgba(255,255,255,0.03)':'transparent';ctx.fillRect(0,y-8,800,28);
    ctx.fillStyle='#e5e7eb';ctx.font='13px sans-serif';
    ctx.fillText(`${c.flag} ${c.name}`,20,y+5);
    ctx.fillStyle='#9ca3af';
    ctx.fillText(c.capital,250,y+5);ctx.fillText(c.currencies.split(':')[0],430,y+5);ctx.fillText(fmt(c.population),600,y+5);
  });
  const a=document.createElement('a');a.download='countries-card.png';a.href=cvs.toDataURL();a.click();
});

if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
