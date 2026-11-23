import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from evaluate import Label, Pred, match, prf, best_team_mapping


def test_match_within_tolerance_by_confidence():
    labels = [Label(10.0, "pass", "A"), Label(10.4, "pass", "B")]
    preds = [Pred(10.3, "pass", 0.9, 0), Pred(10.1, "pass", 0.5, 1), Pred(20.0, "pass", 0.8, 0)]
    pairs = match(labels, preds, 0.48)
    matched = [(l.t, p.t) for l, p, _ in pairs if p is not None]
    # 0.9 at 10.3 takes the nearest label (10.4); 0.5 at 10.1 takes 10.0; 20.0 is a false positive
    assert sorted(matched) == [(10.0, 10.1), (10.4, 10.3)]
    assert [e.t for l, p, e in pairs if e is not None] == [20.0]


def test_class_must_agree_and_missed_labels_count():
    labels = [Label(5.0, "shot", "A"), Label(30.0, "tackle", "B")]
    preds = [Pred(5.0, "pass", 0.9, 0)]
    pairs = match(labels, preds, 1.0)
    tp = sum(p is not None for _, p, _ in pairs)
    fp = sum(e is not None for _, _, e in pairs)
    fn = sum(l is not None and p is None for l, p, _ in pairs)
    assert (tp, fp, fn) == (0, 1, 2)


def test_prf_and_team_mapping():
    assert prf(3, 1, 2) == {"tp": 3, "fp": 1, "fn": 2, "precision": 0.75, "recall": 0.6, "f1": 0.667}
    pairs = [(Label(1, "pass", "B"), Pred(1, "pass", 1, 0)), (Label(2, "pass", "A"), Pred(2, "pass", 1, 1)),
             (Label(3, "pass", "A"), Pred(3, "pass", 1, 0))]
    assert best_team_mapping(pairs) == {0: "B", 1: "A"}
