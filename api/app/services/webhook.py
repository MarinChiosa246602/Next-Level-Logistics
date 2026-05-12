import httpx
import logging

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self, webhook_url: str = "https://webhook.site/your-uuid"):
        self.webhook_url = webhook_url

    async def send_confirmation(self, record_data: dict):
        """
        Sends a notification to the external LMS when a record is confirmed.
        """
        payload = {
            "event": "record.confirmed",
            "record_id": record_data["record_id"],
            "farm_id": record_data["farm_id"],
            "confirmed_at": record_data["updated_at"],
            "record": record_data
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.webhook_url, json=payload, timeout=5.0)
                response.raise_for_status()
                logger.info(f"Webhook sent successfully for record {record_data['record_id']}")
        except Exception as e:
            logger.error(f"Failed to send webhook for record {record_data['record_id']}: {e}")
