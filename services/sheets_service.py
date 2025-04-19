import os
import json
from typing import List, Dict, Any
import gspread
from google.oauth2.service_account import Credentials


class SheetsService:
    """
    Сервис для работы с Google Sheets через gspread и сервисный аккаунт.

    Требует наличия в окружении:
      - GOOGLE_SHEET_ID: ID таблицы Google Sheets.
      - GOOGLE_CREDENTIALS_JSON: JSON-строка с ключами сервисного аккаунта.
    """

    def __init__(self):
        # Загружаем ID таблицы
        sheet_id = os.getenv("GOOGLE_SHEET_ID")
        if not sheet_id:
            raise ValueError("Не задана переменная окружения GOOGLE_SHEET_ID")
        self._sheet_id = sheet_id

        # Загружаем учетные данные сервисного аккаунта
        creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
        if not creds_json:
            raise ValueError("Не задана переменная окружения GOOGLE_CREDENTIALS_JSON")
        info = json.loads(creds_json)

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        credentials = Credentials.from_service_account_info(info, scopes=scopes)
        client = gspread.authorize(credentials)

        # Открываем таблицу
        self._spreadsheet = client.open_by_key(self._sheet_id)

    def append_row(self, sheet_name: str, values: List[Any]) -> None:
        """
        Добавляет новую строку в указанный лист.

        :param sheet_name: Название листа (tab) в таблице.
        :param values: Список значений для новой строки.
        """
        sheet = self._spreadsheet.worksheet(sheet_name)
        sheet.append_row(values, value_input_option='RAW')

    def get_all_records(self, sheet_name: str) -> List[Dict[str, Any]]:
        """
        Возвращает все записи из листа в формате списка словарей.

        :param sheet_name: Название листа.
        :return: Список записей как словарей.
        """
        sheet = self._spreadsheet.worksheet(sheet_name)
        return sheet.get_all_records()

    def find_rows(self, sheet_name: str, column: str, value: Any) -> List[List[Any]]:
        """
        Ищет все строки, где в указанном столбце встречается значение.

        :param sheet_name: Название листа.
        :param column: Буквенное обозначение столбца (например, 'A', 'B').
        :param value: Искомое значение.
        :return: Список строк (каждая — список значений).
        """
        sheet = self._spreadsheet.worksheet(sheet_name)
        try:
            cell_list = sheet.findall(str(value), in_column=gspread.utils.a1_to_rowcol(f"{column}1")[1])
        except Exception:
            # fallback: ищем во всём листе
            cell_list = sheet.findall(str(value))
        rows = []
        for cell in cell_list:
            row = sheet.row_values(cell.row)
            rows.append(row)
        return rows

    def clear_sheet(self, sheet_name: str) -> None:
        """
        Очищает все данные в указанном листе (за исключением заголовка).

        :param sheet_name: Название листа.
        """
        sheet = self._spreadsheet.worksheet(sheet_name)
        sheet.clear()
