// Given-name starts and ends, copied from Morgan's Story-Generator repo, src/content/names.ts at commit 221ee68
// (GWERIN_NAMES for humans, DVERGAR_NAMES for dwarves; D-012). A name is a start followed by an end.
// The two empty ends are in the source on purpose: they make a bare start as likely as two endings.
export const names = {
  human: {
    starts: [
      'Rhys',
      'Gwen',
      'Cad',
      'Elun',
      'Bryn',
      'Mair',
      'Dai',
      'Ceri',
      'Teg',
      'Idr',
      'Owa',
      'Llew',
      'Gar',
      'Hywe',
      'Nest',
      'Morg',
    ],
    ends: ['', '', 'oc', 'ed', 'an', 'wen', 'in', 'ydd', 'a'],
  },
  dwarf: {
    starts: [
      'Grim',
      'Brok',
      'Dur',
      'Thrain',
      'Nor',
      'Balk',
      'Dvall',
      'Skaf',
      'Hrut',
      'Gor',
      'Ivar',
      'Kolb',
      'Mod',
      'Rurik',
      'Vond',
    ],
    ends: ['r', 'k', 'in', 'ar', 'ur', 'li', 'grim', 'rek', 'din'],
  },
};
