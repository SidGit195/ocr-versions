import logging

logger = logging.getLogger("app_logger")
logger.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# For file logging, uncomment below:
# file_handler = logging.FileHandler("app.log")
# file_handler.setFormatter(formatter)
# logger.addHandler(file_handler)
