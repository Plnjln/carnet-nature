import { describe, expect, it } from 'vitest';
import { ANNUAIRE } from '../src/keys/annuaire-data';
import { liensIci, nombreDans, sousRubriques } from '../src/keys/annuaire';
import { CLES } from '../src/keys/cles';

describe('clés par grands groupes', () => {
  it('ont des identifiants uniques', () => {
    const ids = CLES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const cle of CLES) {
    describe(cle.titre, () => {
      it('commence sur une question existante', () => {
        expect(cle.noeuds[cle.debut]?.type).toBe('question');
      });

      it('ne renvoie que vers des nœuds existants', () => {
        for (const [id, noeud] of Object.entries(cle.noeuds)) {
          if (noeud.type !== 'question') continue;
          expect(noeud.choix.length, `question ${id}`).toBeGreaterThanOrEqual(2);
          for (const c of noeud.choix) expect(cle.noeuds[c.vers], `${id} → ${c.vers}`).toBeDefined();
        }
      });

      it('rend tous ses nœuds atteignables, et chaque chemin aboutit à un résultat', () => {
        const vus = new Set<string>();
        const visiter = (id: string, profondeur: number) => {
          expect(profondeur, `boucle possible vers ${id}`).toBeLessThan(30);
          vus.add(id);
          const noeud = cle.noeuds[id];
          if (noeud.type === 'question') for (const c of noeud.choix) visiter(c.vers, profondeur + 1);
        };
        visiter(cle.debut, 0);
        expect([...vus].sort()).toEqual(Object.keys(cle.noeuds).sort());
      });

      it('enchaîne seulement sur des clés existantes', () => {
        for (const noeud of Object.values(cle.noeuds)) {
          if (noeud.type === 'resultat' && noeud.suite) expect(CLES.some((c) => c.id === noeud.suite), noeud.suite).toBe(true);
        }
      });
    });
  }
});

describe('annuaire des clés en ligne', () => {
  it('ne contient que des liens complets, sans doublon', () => {
    expect(new Set(ANNUAIRE.map((l) => l.url)).size).toBe(ANNUAIRE.length);
    for (const l of ANNUAIRE) {
      expect(l.url, l.title).toMatch(/^https?:\/\//);
      expect(l.title.trim().length, l.url).toBeGreaterThan(0);
      expect(l.scope.trim().length, l.url).toBeGreaterThan(0);
      expect(l.path.length, l.url).toBeGreaterThan(0);
      for (const nom of l.path) expect(nom.trim().length, l.url).toBeGreaterThan(0);
    }
  });

  it('range chaque lien dans une rubrique que la navigation permet d’atteindre', () => {
    let total = 0;
    const visiter = (chemin: string[]) => {
      total += liensIci(chemin).length;
      for (const r of sousRubriques(chemin)) visiter([...chemin, r.nom]);
    };
    visiter([]);
    expect(total).toBe(ANNUAIRE.length);
    expect(nombreDans([])).toBe(ANNUAIRE.length);
  });
});
