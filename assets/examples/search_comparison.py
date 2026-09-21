"""Educational example. Counts inspected list elements, not CPU comparisons or time.
Created for the 2026-09-21 article review. Synthetic inputs, no personal data.
Run: python search_comparison.py
"""
import json


def validate(values, target, sorted_required=False):
    if not isinstance(values, list) or any(type(v) is not int for v in values) or type(target) is not int:
        raise ValueError("Use a list of integers and an integer target; bool is not accepted.")
    if sorted_required and any(a > b for a, b in zip(values, values[1:])):
        raise ValueError("Binary search requires a sorted list.")


def linear(values, target):
    validate(values, target)
    trace = []
    for i, value in enumerate(values):
        trace.append(value)
        if value == target:
            return {"index": i, "count": len(trace), "trace": trace}
    return {"index": -1, "count": len(trace), "trace": trace}


def binary(values, target):
    validate(values, target, sorted_required=True)
    low, high, trace = 0, len(values) - 1, []
    while low <= high:
        mid = (low + high) // 2
        trace.append(values[mid])
        if values[mid] == target:
            return {"index": mid, "count": len(trace), "trace": trace}
        if values[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return {"index": -1, "count": len(trace), "trace": trace}


def results():
    values = list(range(2, 17, 2))
    rows = [
        {"target": target, "linear": linear(values, target), "binary": binary(values, target)}
        for target in values
    ]
    return {
        "input": values,
        "rows": rows,
        "mean_linear": sum(row["linear"]["count"] for row in rows) / len(rows),
        "mean_binary": sum(row["binary"]["count"] for row in rows) / len(rows),
        "absent_1": {"linear": linear(values, 1), "binary": binary(values, 1)},
        "empty": {"linear": linear([], 1), "binary": binary([], 1)},
        "duplicate": {"linear": linear([2, 2, 4], 2), "binary": binary([2, 2, 4], 2)},
    }


if __name__ == "__main__":
    print(json.dumps(results(), ensure_ascii=False, indent=2))
