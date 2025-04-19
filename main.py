import os  # Работа с переменными окружения и путями
import logging  # Логирование действий и ошибок
import openai  # Клиент для работы с OpenAI API
from dotenv import load_dotenv  # Загрузка переменных окружения из .env файла
from telegram import Update  # Объект входящего обновления от Telegram
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes  # Конструктор приложения и обработчики
from services.sheets_service import SheetsService  # Класс для работы с Google Sheets через API

# Настройка базового логирования для всей программы
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # Формат сообщений
    level=logging.DEBUG  # Уровень DEBUG для максимальной подробности
)
logger = logging.getLogger(__name__)  # Получаем логгер текущего модуля

# Загрузка переменных из .env в окружение
load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")  # Токен Telegram бота
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Ключ для OpenAI API
# Выводим в лог, были ли они подгружены
logger.debug(f"TELEGRAM_TOKEN is {'set' if TELEGRAM_TOKEN else 'unset'}")
logger.debug(f"OPENAI_API_KEY is {'set' if OPENAI_API_KEY else 'unset'}")

# Инициализируем клиент OpenAI
openai.api_key = OPENAI_API_KEY
logger.debug("OpenAI API key configured")

# Попытка инициализации подключения к Google Sheets
SHEET_SERVICE = None
try:
    SHEET_SERVICE = SheetsService()  # Создаем экземпляр сервиса
    logger.info("SheetsService initialized successfully")  # Инфо-лог успешной инициализации
    print("[DEBUG] SheetsService initialized successfully")  # Консольный вывод
except Exception as e:
    # В случае ошибки логируем критическую информацию
    logger.error(f"Failed to initialize SheetsService: {e}")
    print(f"[DEBUG] Failed to initialize SheetsService: {e}")

# Основная асинхронная функция-обработчик входящих сообщений
async def chat_with_gpt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Извлекаем текст сообщения и информацию о пользователе
    user_input = update.message.text
    user = update.effective_user
    logger.info(f"Received message from user {user.id} (@{user.username}): {user_input}")
    print(f"[DEBUG] Received message: {user_input} from user {user.id}")

    # Если сервис Google Sheets инициализирован, пытаемся записать запрос
    if SHEET_SERVICE:
        try:
            # Добавляем новую строку: UserID, username, текст и время
            SHEET_SERVICE.append_row(
                sheet_name="Лист1",
                values=[str(user.id), user.username or "", user_input, update.message.date.isoformat()]
            )
            logger.debug("Appended message to Google Sheet successfully")
            print("[DEBUG] Appended message to Google Sheet successfully")
        except Exception as e:
            # Логируем любые ошибки записи в таблицу
            logger.error(f"Failed to append row to sheet: {e}")
            print(f"[DEBUG] Failed to append row to sheet: {e}")

    # Подготавливаем и отправляем запрос к OpenAI
    try:
        logger.debug("Sending request to OpenAI...")
        response = openai.chat.completions.create(
            model="gpt-4",  # Используем модель GPT-4
            messages=[
                # Системное сообщение задает роль бота
                {"role": "system", "content": "Ты консультант по 3D‑услугам. Отвечай дружелюбно и понятно."},
                # Пользовательское сообщение
                {"role": "user", "content": user_input}
            ],
            temperature=0.7,  # Регулирует случайность ответов
            max_tokens=500  # Максимальное число токенов в ответе
        )
        # Извлечение текста ответа
        answer = response.choices[0].message.content
        logger.info(f"OpenAI responded with {len(answer)} characters")
        print(f"[DEBUG] OpenAI response: {answer}")
        # Отправляем ответ пользователю
        await update.message.reply_text(answer)
    except Exception as e:
        # Обработка и логирование ошибок при запросе к OpenAI
        logger.error(f"OpenAI API error: {e}")
        print(f"[DEBUG] OpenAI API error: {e}")
        await update.message.reply_text(f"Ошибка при запросе к OpenAI: {e}")

# Функция для старта бота и регистрации обработчика
def main():
    logger.debug("Starting bot application...")
    print("[DEBUG] Starting bot application...")
    # Создаем приложение Telegram и регистрируем хендлер для текстовых сообщений
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat_with_gpt))
    logger.info("Bot started and polling for messages")
    print("[DEBUG] Bot started and polling for messages")
    # Запуск бесконечного цикла получения обновлений
    app.run_polling()

# Точка входа при запуске скрипта напрямую
if __name__ == "__main__":
    main()
