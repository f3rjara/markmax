import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Paleta de colores para el resaltado de sintaxis dentro de bloques de codigo.
 * Cada propiedad representa una categoria semantica de tokens.
 */
export interface CodeHighlightPalette {
  /** Comentarios de linea, bloque y doc (# // /* *\/) */
  comment: string;
  /** Strings, caracteres y template literals */
  string: string;
  /** Secuencias de escape dentro de strings (\n, \t, \u...) */
  escape: string;
  /** Numeros enteros y decimales */
  number: string;
  /** Booleanos (true/false) y null/undefined/None */
  nullish: string;
  /**
   * Identificadores genericos: comandos Bash, nombres en Python/Ruby,
   * nombres de variables sin tipo especifico. Es el tag mas comun en parsers
   * de lenguajes dinamicos. Mapea t.name, t.atom, t.labelName, t.macroName.
   */
  name: string;
  /** Palabras clave de control (if, for, return, while, match...) */
  controlKeyword: string;
  /** Palabras clave de definicion (const, let, var, function, class, def...) */
  definitionKeyword: string;
  /** Palabras clave de modulo (import, export, from, require...) */
  moduleKeyword: string;
  /** Operadores aritmeticos (+, -, *, /) */
  arithmeticOperator: string;
  /** Operadores de comparacion (==, !=, <, >, <=, >=) */
  compareOperator: string;
  /** Operadores logicos (&&, ||, !, and, or, not) */
  logicOperator: string;
  /** Operadores genericos y de bits */
  operator: string;
  /** Puntuacion generica (., ;, :) */
  punctuation: string;
  /** Brackets, llaves y parentesis */
  bracket: string;
  /** Nombres de variables locales */
  variableName: string;
  /** Nombres de funciones al invocar: foo() */
  functionCall: string;
  /** Nombres de funciones en definicion: function foo / def foo */
  functionDef: string;
  /** Nombres de propiedades de objeto: obj.prop */
  propertyName: string;
  /** Nombres de tipos, interfaces y clases */
  typeName: string;
  /** Etiquetas HTML/JSX (<div>, <App>) */
  tagName: string;
  /** Atributos HTML/JSX (class=, href=) */
  attributeName: string;
  /** Valores de atributos HTML ("valor") */
  attributeValue: string;
  /** Metadatos, decoradores, directivas (@decorator, #!) */
  meta: string;
  /** Expresiones regulares */
  regexp: string;
  /** Lineas insertadas en diffs */
  inserted: string;
  /** Lineas eliminadas en diffs */
  deleted: string;
  /** Lineas modificadas en diffs */
  changed: string;
}

/**
 * Paleta por defecto. Inspirada en VS Code Dark+ / One Dark Pro:
 * colores vivos y semanticamente diferenciados para fondos oscuros.
 */
export const DEFAULT_CODE_PALETTE: CodeHighlightPalette = {
  comment: '#7F8C8D', // Gris neutro/apagado — Comentarios
  string: '#FF7675', // Coral/Rojo vivo — Strings
  escape: '#FFEAA7', // Amarillo pastel brillante — Escapes
  number: '#E84393', // Rosa/Fucsia electrico — Numeros
  nullish: '#00CEC9', // Turquesa/Cian — null/true/false/None
  name: '#DFE6E9', // Gris muy claro — Identificadores genericos (comandos bash, nombres python)
  controlKeyword: '#D63031', // Rojo intenso — if/for/return/while
  definitionKeyword: '#74B9FF', // Azul cielo electrico — const/function/class/def
  moduleKeyword: '#A29BFE', // Lavanda/Morado claro — import/export/from
  arithmeticOperator: '#81ECEC', // Cian claro — +, -, *, /
  compareOperator: '#FDCB6E', // Amarillo naranja — ==, !=, <, >, <=, >=
  logicOperator: '#E17055', // Naranja — &&, ||, and, or, not
  operator: '#F5F6FA', // Blanco suave — operadores genericos
  punctuation: '#B2BEC3', // Gris claro — Puntuacion
  bracket: '#F1C40F', // Amarillo oro brillante — Brackets/Llaves
  variableName: '#9CDCFE', // Celeste — Variables tipadas (TS, Java...)
  functionCall: '#FFEAA7', // Amarillo brillante — Llamadas a funciones
  functionDef: '#FAB1A0', // Naranja pastel vivo — Definiciones de funciones
  propertyName: '#00CEC9', // Turquesa — Propiedades (ideal para JSON)
  typeName: '#9B59B6', // Morado saturado — Tipos e interfaces
  tagName: '#FF7675', // Coral — Etiquetas HTML/JSX
  attributeName: '#74B9FF', // Azul cielo — Atributos HTML
  attributeValue: '#FF7675', // Coral — Valores de atributos HTML
  meta: '#636E72', // Gris medio — decoradores, shebangs
  regexp: '#E17055', // Naranja terracota — Expresiones regulares
  inserted: '#2ECC71', // Verde esmeralda — Diff insertado
  deleted: '#E74C3C', // Rojo encendido — Diff eliminado
  changed: '#F39C12', // Naranja brillante — Diff modificado
};

/**
 * Construye un HighlightStyle para tokens de lenguajes de programacion
 * a partir de la paleta proporcionada.
 *
 * Cubre TODOS los tags de @lezer/highlight para maxima compatibilidad con
 * Bash, Python, JavaScript, TypeScript, CSS, HTML, JSON, SQL, etc.
 *
 * Uso:
 * ```ts
 * // Con paleta por defecto
 * const style = buildCodeHighlightStyle();
 *
 * // Con paleta personalizada
 * const style = buildCodeHighlightStyle({ ...DEFAULT_CODE_PALETTE, string: '#FF6B6B' });
 * ```
 */
export function buildCodeHighlightStyle(
  palette: CodeHighlightPalette = DEFAULT_CODE_PALETTE,
): HighlightStyle {
  return HighlightStyle.define([
    // ── Comentarios ────────────────────────────────────────────────────────
    { tag: t.comment, color: palette.comment, fontStyle: 'italic' },
    { tag: t.lineComment, color: palette.comment, fontStyle: 'italic' },
    { tag: t.blockComment, color: palette.comment, fontStyle: 'italic' },
    { tag: t.docComment, color: palette.comment, fontStyle: 'italic' },

    // ── Strings ────────────────────────────────────────────────────────────
    { tag: t.string, color: palette.string },
    { tag: t.docString, color: palette.string },
    { tag: t.character, color: palette.string },
    { tag: t.special(t.brace), color: palette.string },
    { tag: t.escape, color: palette.escape },
    { tag: t.regexp, color: palette.regexp },

    // ── Numeros ────────────────────────────────────────────────────────────
    { tag: t.number, color: palette.number },
    { tag: t.integer, color: palette.number },
    { tag: t.float, color: palette.number },

    // ── Valores atomicos (null, true, false, None, undefined) ──────────────
    // t.atom: Bash/Python/Elixir usan esto para None, True, False, nil...
    { tag: t.bool, color: palette.nullish },
    { tag: t.null, color: palette.nullish },
    { tag: t.atom, color: palette.nullish },

    // ── Nombres genericos (el tag MAS COMUN en lenguajes dinamicos) ─────────
    // Bash: comandos (sudo, apt, mkdir, cd, git...)
    // Python: nombres de variables, modulos, parametros
    // Ruby: nombres de metodos
    // Sin este tag, la mayoria de tokens en Bash/Python quedan sin color.
    { tag: t.name, color: palette.name },
    { tag: t.labelName, color: palette.name },
    { tag: t.macroName, color: palette.name },
    { tag: t.standard(t.name), color: palette.functionCall },

    // ── Keywords de definicion (const, function, class, def, let, var...) ──
    { tag: t.definitionKeyword, color: palette.definitionKeyword, fontWeight: 'bold' },
    { tag: t.modifier, color: palette.definitionKeyword, fontWeight: 'bold' },

    // ── Keywords de modulo (import, export, from, require, use...) ──────────
    { tag: t.moduleKeyword, color: palette.moduleKeyword, fontWeight: 'bold' },

    // ── Keywords de control (if, else, for, while, return, match...) ────────
    { tag: t.keyword, color: palette.controlKeyword, fontWeight: 'bold' },
    { tag: t.controlKeyword, color: palette.controlKeyword, fontWeight: 'bold' },
    { tag: t.operatorKeyword, color: palette.controlKeyword, fontWeight: 'bold' },
    { tag: t.controlOperator, color: palette.controlKeyword },
    { tag: t.self, color: palette.controlKeyword },

    // ── Operadores especializados ───────────────────────────────────────────
    { tag: t.arithmeticOperator, color: palette.arithmeticOperator },
    { tag: t.compareOperator, color: palette.compareOperator },
    { tag: t.logicOperator, color: palette.logicOperator },
    { tag: t.bitwiseOperator, color: palette.operator },
    { tag: t.updateOperator, color: palette.arithmeticOperator },
    { tag: t.definitionOperator, color: palette.operator },
    { tag: t.operator, color: palette.operator },
    { tag: t.derefOperator, color: palette.operator },

    // ── Puntuacion ─────────────────────────────────────────────────────────
    { tag: t.punctuation, color: palette.punctuation },
    { tag: t.separator, color: palette.punctuation },

    // ── Brackets, llaves y parentesis ──────────────────────────────────────
    { tag: t.bracket, color: palette.bracket },
    { tag: t.angleBracket, color: palette.bracket },
    { tag: t.squareBracket, color: palette.bracket },
    { tag: t.paren, color: palette.bracket },
    { tag: t.brace, color: palette.bracket },

    // ── Variables ──────────────────────────────────────────────────────────
    { tag: t.variableName, color: palette.variableName },
    { tag: t.definition(t.variableName), color: palette.variableName },
    { tag: t.local(t.variableName), color: palette.variableName },
    { tag: t.special(t.variableName), color: palette.variableName },

    // ── Funciones: llamadas vs definiciones ────────────────────────────────
    { tag: t.function(t.variableName), color: palette.functionCall },
    { tag: t.function(t.name), color: palette.functionCall },
    { tag: t.function(t.propertyName), color: palette.functionDef },
    { tag: t.definition(t.propertyName), color: palette.functionDef },
    { tag: t.definition(t.name), color: palette.functionDef },

    // ── Propiedades ────────────────────────────────────────────────────────
    { tag: t.propertyName, color: palette.propertyName },
    { tag: t.attributeName, color: palette.attributeName },

    // ── Tipos e interfaces ─────────────────────────────────────────────────
    { tag: t.typeName, color: palette.typeName },
    { tag: t.typeOperator, color: palette.definitionKeyword },
    { tag: t.namespace, color: palette.typeName },
    { tag: t.className, color: palette.typeName },

    // ── HTML / JSX ─────────────────────────────────────────────────────────
    { tag: t.tagName, color: palette.tagName },
    { tag: t.attributeValue, color: palette.attributeValue },

    // ── Metadatos y directivas (@decorador, #!/usr/bin/env...) ─────────────
    { tag: t.meta, color: palette.meta },
    { tag: t.documentMeta, color: palette.meta },
    { tag: t.annotation, color: palette.meta },

    // ── Unidades (CSS: px, em, rem, %) ─────────────────────────────────────
    { tag: t.unit, color: palette.number },
    { tag: t.color, color: palette.string },

    // ── Diffs ──────────────────────────────────────────────────────────────
    { tag: t.literal, color: palette.number },
    { tag: t.inserted, color: palette.inserted },
    { tag: t.deleted, color: palette.deleted },
    { tag: t.changed, color: palette.changed },
  ]);
}

/** Instancia de highlight con la paleta por defecto, lista para usar. */
export const codeHighlightStyle = buildCodeHighlightStyle();
