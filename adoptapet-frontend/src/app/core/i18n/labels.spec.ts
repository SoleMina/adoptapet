import {
  adoptionStatusLabel,
  healthStatusLabel,
  petAgeLabel,
  speciesLabel,
  sterilizationLabel,
} from './labels';

describe('labels', () => {
  it('formats the pet age like the design', () => {
    expect(petAgeLabel(2, 0)).toBe('2 años');
    expect(petAgeLabel(1, 0)).toBe('1 año');
    expect(petAgeLabel(0, 8)).toBe('8 meses');
    expect(petAgeLabel(1, 3)).toBe('1 año y 3 meses');
    expect(petAgeLabel(0, 0)).toBe('Menos de 1 mes');
  });

  it('agrees in gender with the pet', () => {
    expect(healthStatusLabel('HEALTHY', 'FEMALE')).toBe('Sana');
    expect(healthStatusLabel('HEALTHY', 'MALE')).toBe('Sano');
    expect(sterilizationLabel('STERILIZED', 'FEMALE')).toBe('Esterilizada');
    expect(adoptionStatusLabel('ADOPTED', 'MALE')).toBe('Adoptado');
    expect(adoptionStatusLabel('AVAILABLE', 'MALE')).toBe('Disponible');
  });

  it('translates common English species and keeps the rest', () => {
    expect(speciesLabel('Dog')).toBe('Perro');
    expect(speciesLabel(' cat ')).toBe('Gato');
    expect(speciesLabel('Perro')).toBe('Perro');
  });
});
