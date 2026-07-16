const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  HeadingLevel, AlignmentType, BorderStyle, ShadingType, Header, Footer, PageBreak,
  PageNumber, TabStopType, TabStopPosition
} = require('docx');

const NAVY = '1E3A5F';
const AMBER = '9A5F0B';
const GREY = '6E6A5C';
const LIGHT = 'F1EDE0';

const ALERGENOS_14 = ['Cereales con gluten','Crustáceos','Huevos','Pescado','Cacahuetes','Soja',
  'Leche y lactosa','Frutos de cáscara','Apio','Mostaza','Sésamo','Sulfitos','Altramuces','Moluscos'];

const INGREDIENTES = {
  papa:       { nombre: 'Papa negra canaria', unidad: 'kg', precio: 1.85, merma: 8 },
  pim_rojo:   { nombre: 'Pimiento rojo', unidad: 'kg', precio: 3.05, merma: 15 },
  pim_verde:  { nombre: 'Pimiento verde', unidad: 'kg', precio: 2.40, merma: 15 },
  aceite:     { nombre: 'Aceite de oliva', unidad: 'l', precio: 6.50, merma: 0 },
  ajo:        { nombre: 'Ajo', unidad: 'kg', precio: 8.00, merma: 12 },
  comino:     { nombre: 'Comino molido', unidad: 'kg', precio: 14.00, merma: 0 },
  sal:        { nombre: 'Sal gruesa', unidad: 'kg', precio: 0.80, merma: 0 },
  vinagre:    { nombre: 'Vinagre de vino', unidad: 'l', precio: 1.50, merma: 0 },
  pimenton:   { nombre: 'Pimentón', unidad: 'kg', precio: 12.00, merma: 0 },
  ternera:    { nombre: 'Falda de ternera', unidad: 'kg', precio: 9.80, merma: 20 },
  garbanzo:   { nombre: 'Garbanzo cocido', unidad: 'kg', precio: 2.20, merma: 0 },
  cebolla:    { nombre: 'Cebolla', unidad: 'kg', precio: 1.10, merma: 10 },
  tomate:     { nombre: 'Tomate', unidad: 'kg', precio: 1.95, merma: 10 },
  vieja:      { nombre: 'Vieja (pescado local)', unidad: 'kg', precio: 12.50, merma: 35 },
  gofio:      { nombre: 'Gofio de millo', unidad: 'kg', precio: 2.80, merma: 0 },
  queso:      { nombre: 'Queso canario semicurado', unidad: 'kg', precio: 11.00, merma: 5 },
  platano:    { nombre: 'Plátano de Canarias', unidad: 'kg', precio: 2.30, merma: 30 },
  miel_palma: { nombre: 'Miel de palma', unidad: 'l', precio: 15.00, merma: 0 },
  vino:       { nombre: 'Vino blanco de cocina', unidad: 'l', precio: 2.80, merma: 0 },
};

const ALERGENOS_ING = {
  vinagre: { 'Sulfitos': 'Contiene' },
  vieja: { 'Pescado': 'Contiene' },
  gofio: { 'Cereales con gluten': 'Pendiente de validar' },
  queso: { 'Leche y lactosa': 'Contiene' },
  vino: { 'Sulfitos': 'Contiene' },
};

const IMPUESTO = 7, FC_OBJETIVO = 30;

const PLATOS = [
  { codigo:'PL-001', nombre:'Papas arrugadas con mojo rojo', categoria:'Entrante', raciones:1, pvp:4.50, extrasPct:6, packaging:0,
    lineas:[['papa',250],['pim_rojo',30],['aceite',15],['ajo',6],['comino',1],['sal',8],['vinagre',5],['pimenton',2]],
    ficha:{elaboracion:'Lavar las papas sin pelar y cocer en agua muy salada 25-30 min hasta arrugar. Escurrir y secar al fuego. Mojo: triturar pimiento, ajo, comino, pimentón, vinagre, sal y aceite.',
      conservacion:'Mojo en frío positivo (0-4°C) en recipiente cerrado. Papas: elaboración al momento.',
      temperatura:'Servicio caliente, mojo a temperatura ambiente.', vida:'Mojo: 5 días refrigerado. Papas: consumo inmediato.',
      notas:'No pelar la papa. Punto de sal alto en cocción, sin sal añadida al emplatar.'} },
  { codigo:'PL-002', nombre:'Ropa vieja canaria', categoria:'Principal', raciones:1, pvp:9.50, extrasPct:8, packaging:0,
    lineas:[['ternera',160],['garbanzo',120],['papa',120],['cebolla',50],['pim_rojo',40],['tomate',60],['aceite',20],['ajo',5],['vino',30]],
    ficha:{elaboracion:'Guisar la falda hasta que se deshebre. Sofrito de cebolla, pimiento, ajo y tomate; añadir carne deshebrada, garbanzos y papas fritas en dados. Ligar y reposar.',
      conservacion:'Frío positivo 0-4°C tapado. Regenerar a +65°C en corazón.', temperatura:'+65°C.',
      vida:'3 días refrigerado, 2 meses congelado.', notas:'Sulfitos por el vino. Mejora al día siguiente.'} },
  { codigo:'PL-003', nombre:'Vieja a la espalda con mojo verde', categoria:'Principal', raciones:1, pvp:14.00, extrasPct:6, packaging:0,
    lineas:[['vieja',300],['papa',150],['pim_verde',25],['aceite',20],['ajo',6],['sal',5],['vinagre',5]],
    ficha:{elaboracion:'Abrir la vieja a la espalda, plancha fuerte por piel, terminar con refrito de ajo. Acompañar de papas y mojo verde.',
      conservacion:'Pescado fresco 0-2°C sobre hielo, máx 24h.', temperatura:'+63°C.', vida:'Consumo en el día.',
      notas:'Merma alta (35%): pedir limpia al proveedor si compensa el sobreprecio.'} },
  { codigo:'PL-004', nombre:'Queso asado con miel de palma', categoria:'Entrante', raciones:1, pvp:7.00, extrasPct:4, packaging:0,
    lineas:[['queso',140],['miel_palma',15],['gofio',8],['aceite',5]],
    ficha:{elaboracion:'Marcar el queso a la plancha por ambas caras. Emplatar con miel de palma y espolvoreo de gofio tostado.',
      conservacion:'Queso en frío positivo 0-4°C envuelto.', temperatura:'Caliente, servicio inmediato.', vida:'Queso abierto: 7 días.',
      notas:'Confirmar con proveedor si el gofio es 100% millo o mezcla con trigo.'} },
  { codigo:'PL-005', nombre:'Plátano frito con gofio y miel', categoria:'Postre', raciones:1, pvp:5.50, extrasPct:4, packaging:0,
    lineas:[['platano',180],['miel_palma',12],['gofio',10],['aceite',10]],
    ficha:{elaboracion:'Freír el plátano maduro en aceite a 170°C hasta dorar. Emplatar con gofio y miel de palma.',
      conservacion:'Elaboración al momento.', temperatura:'Caliente.', vida:'Consumo inmediato.',
      notas:'Usar plátano bien maduro; la merma del 30% corresponde a la piel.'} },
];

function costeUtil(ing){ return ing.precio / (1 - ing.merma/100); }
function calcPlato(p){
  let costeIng = 0;
  for (const [id, cant] of p.lineas) {
    const ing = INGREDIENTES[id];
    costeIng += (cant/1000) * costeUtil(ing);
  }
  const extras = costeIng * p.extrasPct/100;
  const costeDirecto = costeIng + extras + p.packaging;
  const costeRacion = costeDirecto / p.raciones;
  const pvpBase = p.pvp / (1 + IMPUESTO/100);
  const fc = costeRacion / pvpBase * 100;
  const margen = pvpBase - costeRacion;
  const margenPct = margen / pvpBase * 100;
  const recBase = costeRacion / (FC_OBJETIVO/100);
  const recFinal = Math.ceil(recBase * (1+IMPUESTO/100) * 20) / 20;
  const diag = fc > FC_OBJETIVO+5 ? 'No rentable' : fc > FC_OBJETIVO ? 'Revisar' : 'Rentable';
  return { costeIng, extras, costeDirecto, costeRacion, pvpBase, fc, margen, margenPct, recFinal, diag };
}
function alergenosPlato(p){
  const map = {};
  const rank = { 'Contiene':3, 'Pendiente de validar':2, 'Puede contener trazas':1 };
  for (const [id] of p.lineas) {
    const als = ALERGENOS_ING[id]; if (!als) continue;
    for (const [al, estado] of Object.entries(als)) {
      if (!map[al] || rank[estado] > rank[map[al]]) map[al] = estado;
    }
  }
  return map;
}
const eur = n => n.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €';
const pct = n => n.toLocaleString('es-ES', {minimumFractionDigits:1, maximumFractionDigits:1}) + '%';

function cell(text, opts={}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    margins: { top:80, bottom:80, left:100, right:100 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, bold: !!opts.bold, color: opts.color, size: opts.size || 19 })]
    })]
  });
}

function tituloPlato(p) {
  return [
    new Paragraph({ children: [ new PageBreak() ] }),
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [ new TextRun({ text: p.nombre, bold: true, size: 32, color: NAVY }) ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [ new TextRun({ text: `${p.codigo}  ·  ${p.categoria}  ·  ${p.raciones} ración/es  ·  Zona: Canarias (IGIC ${IMPUESTO}%)`, italics: true, color: GREY, size: 19 }) ]
    })
  ];
}

function tablaEscandallo(p) {
  const header = new TableRow({ tableHeader: true, children: [
    cell('Ingrediente', {bold:true, color:'FFFFFF', shade:NAVY, width:3200}),
    cell('Cantidad', {bold:true, color:'FFFFFF', shade:NAVY, width:1400, align:AlignmentType.RIGHT}),
    cell('Merma', {bold:true, color:'FFFFFF', shade:NAVY, width:1000, align:AlignmentType.RIGHT}),
    cell('Coste útil', {bold:true, color:'FFFFFF', shade:NAVY, width:1600, align:AlignmentType.RIGHT}),
    cell('Coste línea', {bold:true, color:'FFFFFF', shade:NAVY, width:1600, align:AlignmentType.RIGHT}),
  ]});
  const rows = p.lineas.map(([id, cant]) => {
    const ing = INGREDIENTES[id];
    const u = ing.unidad === 'ud' ? 'ud' : ing.unidad === 'l' ? 'ml' : 'g';
    const lineCost = (cant/1000) * costeUtil(ing);
    return new TableRow({ children: [
      cell(ing.nombre, {width:3200}),
      cell(`${cant} ${u}`, {width:1400, align:AlignmentType.RIGHT}),
      cell(`${ing.merma}%`, {width:1000, align:AlignmentType.RIGHT}),
      cell(`${costeUtil(ing).toFixed(2)} €/${ing.unidad}`, {width:1600, align:AlignmentType.RIGHT}),
      cell(eur(lineCost), {width:1600, align:AlignmentType.RIGHT, bold:true}),
    ]});
  });
  return new Table({ width: { size: 8800, type: WidthType.DXA }, columnWidths:[3200,1400,1000,1600,1600], rows: [header, ...rows] });
}

function tablaResumenCoste(c, p) {
  const header = new TableRow({ tableHeader:true, children: [
    cell('Concepto', {bold:true, color:'FFFFFF', shade:NAVY, width:4400}),
    cell('Valor', {bold:true, color:'FFFFFF', shade:NAVY, width:4400, align:AlignmentType.RIGHT}),
  ]});
  const filas = [
    ['Coste ingredientes', eur(c.costeIng)],
    [`Condimentos y varios (${p.extrasPct}%)`, eur(c.extras)],
    ['Packaging', eur(p.packaging)],
    ['Coste directo', eur(c.costeDirecto)],
    ['Coste por ración', eur(c.costeRacion)],
    ['PVP carta (con IGIC)', eur(p.pvp)],
    ['PVP sin impuesto', eur(c.pvpBase)],
    ['Food cost', pct(c.fc)],
    ['Margen bruto', eur(c.margen)],
    ['Margen %', pct(c.margenPct)],
    [`Food cost objetivo (${FC_OBJETIVO}%) · PVP recomendado`, eur(c.recFinal)],
  ];
  const rows = filas.map(([k,v],i) => new TableRow({ children: [
    cell(k, {width:4400, shade: i%2? 'FFFFFF':LIGHT}),
    cell(v, {width:4400, align:AlignmentType.RIGHT, bold:true, shade: i%2? 'FFFFFF':LIGHT}),
  ]}));
  return new Table({ width:{size:8800,type:WidthType.DXA}, columnWidths:[4400,4400], rows:[header,...rows] });
}

function bloqueDiagnostico(c) {
  const color = c.diag === 'Rentable' ? '1F6F8B' : c.diag === 'Revisar' ? AMBER : 'B23C30';
  const shade = c.diag === 'Rentable' ? 'DBE9EE' : c.diag === 'Revisar' ? 'F6E9D2' : 'F3DED9';
  return new Table({
    width:{size:8800,type:WidthType.DXA}, columnWidths:[8800],
    rows:[new TableRow({children:[ new TableCell({
      width:{size:8800,type:WidthType.DXA}, shading:{type:ShadingType.CLEAR, fill:shade}, margins:{top:120,bottom:120,left:150,right:150},
      children:[new Paragraph({children:[new TextRun({text:`Diagnóstico: ${c.diag}`, bold:true, color, size:22})]})]
    })]})]
  });
}

function tablaAlergenos(al) {
  const header = new TableRow({ tableHeader:true, children:[
    cell('Alérgeno (Reg. UE 1169/2011)', {bold:true, color:'FFFFFF', shade:NAVY, width:4400}),
    cell('Estado', {bold:true, color:'FFFFFF', shade:NAVY, width:4400}),
  ]});
  const rows = ALERGENOS_14.map((a,i) => {
    const estado = al[a] || 'No contiene';
    const color = estado === 'Contiene' ? 'B23C30' : estado === 'Pendiente de validar' ? AMBER : estado === 'Puede contener trazas' ? AMBER : '2B2A25';
    return new TableRow({children:[
      cell(a, {width:4400, shade:i%2?'FFFFFF':LIGHT}),
      cell(estado, {width:4400, shade:i%2?'FFFFFF':LIGHT, color, bold: estado!=='No contiene'}),
    ]});
  });
  return new Table({ width:{size:8800,type:WidthType.DXA}, columnWidths:[4400,4400], rows:[header,...rows] });
}

function seccion(titulo) {
  return new Paragraph({ spacing:{before:260, after:100}, children:[ new TextRun({text:titulo, bold:true, size:22, color:NAVY}) ] });
}

function fichaTecnica(p) {
  const campos = [['Elaboración','elaboracion'],['Conservación','conservacion'],['Temperatura de servicio','temperatura'],['Vida útil','vida'],['Observaciones','notas']];
  const out = [];
  for (const [label, key] of campos) {
    out.push(new Paragraph({ spacing:{before:100}, children:[ new TextRun({text: label+': ', bold:true, size:19}), new TextRun({text: p.ficha[key], size:19}) ] }));
  }
  return out;
}

const children = [
  new Paragraph({ heading: HeadingLevel.TITLE, spacing:{after:80}, children:[ new TextRun({text:'Fichas técnicas de escandallo', color:NAVY}) ] }),
  new Paragraph({ spacing:{after:40}, children:[ new TextRun({text:'La Tasca del Puerto · Guía de Isora, Tenerife', italics:true, color:GREY}) ] }),
  new Paragraph({ spacing:{after:300}, children:[ new TextRun({text:`Generado el ${new Date().toLocaleDateString('es-ES')} · Zona fiscal Canarias (IGIC ${IMPUESTO}%) · Food cost objetivo ${FC_OBJETIVO}%`, size:18, color:GREY}) ] }),
];

for (const p of PLATOS) {
  const c = calcPlato(p);
  const al = alergenosPlato(p);
  children.push(...tituloPlato(p));
  children.push(seccion('Escandallo'));
  children.push(tablaEscandallo(p));
  children.push(new Paragraph({spacing:{before:160}, children:[]}));
  children.push(tablaResumenCoste(c, p));
  children.push(new Paragraph({spacing:{before:160}, children:[]}));
  children.push(bloqueDiagnostico(c));
  children.push(seccion('Alérgenos (14 obligatorios UE)'));
  children.push(tablaAlergenos(al));
  children.push(new Paragraph({spacing:{before:80}, children:[ new TextRun({text:'Validar siempre con información real de proveedor y etiquetado de producto. Esta tabla es orientativa y no sustituye la validación oficial.', italics:true, size:16, color:GREY}) ] }));
  children.push(seccion('Ficha técnica de cocina'));
  children.push(...fichaTecnica(p));
}

const doc = new Document({
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top:1000, bottom:1000, left:1000, right:1000 } } },
    headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.RIGHT, children:[ new TextRun({text:'Chef Online · Fichas técnicas', size:16, color:GREY}) ] }) ] }) },
    footers: { default: new Footer({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children:[ new TextRun({ children:[PageNumber.CURRENT], size:16, color:GREY }) ] }) ] }) },
    children,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/docx_build/chef_online_fichas_tecnicas.docx', buf);
  console.log('OK');
});
