import { joinedCardStyle } from './joined-cards';

const card = { gap: 8, radius: 6 };

test('a card on its own is round and keeps its place', () => {
  expect(
    joinedCardStyle({ ...card, withPrevious: false, withNext: false }),
  ).toEqual({
    marginTop: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  });
});

test('a card in the middle of a block has square corners and shares its top border', () => {
  expect(
    joinedCardStyle({ ...card, withPrevious: true, withNext: true }),
  ).toEqual({
    marginTop: -9,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
});

test('the ends of a block are round on the outside only', () => {
  expect(
    joinedCardStyle({ ...card, withPrevious: false, withNext: true }),
  ).toMatchObject({
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 0,
  });
  expect(
    joinedCardStyle({ ...card, withPrevious: true, withNext: false }),
  ).toMatchObject({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 6,
  });
});
