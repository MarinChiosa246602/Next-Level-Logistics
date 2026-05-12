import json
import asyncio
from app.db.session import SessionLocal
from app.pipeline.processor import AIProcessor
from datetime import datetime

async def run_validation():
    print("Starting AI Pipeline Accuracy Validation...")

    with open("api/tests/ground_truth.json", "r") as f:
        dataset = json.load(f)

    db = SessionLocal()
    processor = AIProcessor(db=db)

    results = {
        "product_type": {"correct": 0, "total": 0},
        "quantity": {"correct": 0, "total": 0},
        "condition": {"correct": 0, "total": 0},
        "expiry_date": {"correct": 0, "total": 0},
    }

    failure_modes = []

    for entry in dataset:
        url = entry["image_url"]
        gt = entry["ground_truth"]

        # We need a dummy record ID to use the processor's internal logic
        # since we just want to test the AI logic, not the DB storage.
        # We'll mock the DB part or just call the services directly.

        # Let's manually trigger the services since we don't want to create 50 records in DB
        from app.pipeline.vision import VisionService
        from app.pipeline.ocr import OCRService

        vision = VisionService()
        ocr = OCRService()

        vision_data = await vision.analyze_image(url)
        ocr_data = await ocr.extract_text(url)

        # 1. Product Type Accuracy
        if vision_data["product_type"] == gt["product_type"]:
            results["product_type"]["correct"] += 1
        else:
            failure_modes.append(f"Product Type Error: GT {gt['product_type']} vs AI {vision_data['product_type']} for {url}")
        results["product_type"]["total"] += 1

        # 2. Quantity Accuracy (within +/- 20%)
        ai_qty = vision_data["estimated_quantity"]
        gt_qty = gt["quantity"]
        if abs(ai_qty - gt_qty) / gt_qty <= 0.20:
            results["quantity"]["correct"] += 1
        else:
            failure_modes.append(f"Quantity Error: GT {gt_qty} vs AI {ai_qty} for {url}")
        results["quantity"]["total"] += 1

        # 3. Condition Accuracy
        if vision_data["condition_rating"] == gt["condition"]:
            results["condition"]["correct"] += 1
        else:
            failure_modes.append(f"Condition Error: GT {gt['condition']} vs AI {vision_data['condition_rating']} for {url}")
        results["condition"]["total"] += 1

        # 4. Expiry Date Accuracy
        if ocr_data["expiry_date"] == gt["expiry_date"]:
            results["expiry_date"]["correct"] += 1
        else:
            failure_modes.append(f"Expiry Date Error: GT {gt['expiry_date']} vs AI {ocr_data['expiry_date']} for {url}")
        results["expiry_date"]["total"] += 1

    # Calculate final percentages
    print("\n--- FINAL ACCURACY REPORT ---")
    print(f"{'Field':<20} | {'Correct':<10} | {'Total':<10} | {'Accuracy':<10}")
    print("-" * 55)

    overall_sum = 0
    for field, data in results.items():
        acc = (data["correct"] / data["total"]) * 100
        overall_sum += acc
        print(f"{field:<20} | {data['correct']:<10} | {data['total']:<10} | {acc:.2f}%")

    print("-" * 55)
    print(f"OVERALL ACCURACY: {overall_sum / 4:.2f}%")

    print("\n--- FAILURE MODES ---")
    if not failure_modes:
        print("No failures detected.")
    else:
        # Print first 10 failures
        for fm in failure_modes[:10]:
            print(fm)
        print(f"... and {len(failure_modes)-10} more.")

if __name__ == "__main__":
    asyncio.run(run_validation())
