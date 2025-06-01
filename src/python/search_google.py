import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging
import sys
import json
import time
import requests
import socket
import platform

URL = 'https://www.google.es/webhp?num=100'
ENTER = '\ue007'  # Tecla Enter en Selenium (Key.ENTER)
SEARCH_INPUT = '[name="q"]'
DECLINE_COOKIES = 'div[role="dialog"] > div:last-child > span > div > div > div > div:nth-child(3) > div:first-child > button:last-child'
SEARCH_FORM_BUTTON = 'form[role="search"] [name="btnK"]'
URLS_ELEMENTS = 'div#res > #search div.g, div.MjjYud'
ACCORDION_EXPANDER = 'div[data-g][data-ullb]'
LINK_ELEMENT = 'span[jscontroller][jsaction] > a[href][jsname][data-ved]'
POSITION_VAR = '{{position}}'
CLIENT_URL_FOUND = '<div style="position: absolute; top: -10px; border: 4px solid #e64a89; width: calc(100% + 10px); height: calc(100% + 10px); left: -10px; border-radius: 13px;" ></div>'
COMPETITOR_URL_FOUND = '<div style="position: absolute; top: -10px; border: 4px solid #4a9de6; width: calc(100% + 10px); height: calc(100% + 10px); left: -10px; border-radius: 13px;" ></div>'
CAPTCHA_INFO = '#infoDiv'
DEFAULT_TIME_OUT = 5
DEFAULT_WAIT = 1
NUMBER_POSITION = f'''
<div style="position: absolute; font-size: 14px; top: 46px; right: calc(100% + 15px); font-weight: 600; width: auto; text-align: center; display: flex; flex-direction: column; justify-content: center;" >
{POSITION_VAR}
</div>
'''


def CONTAINER_URLS(
    keyword): return f'div#res > #search div[data-async-context="query:{keyword}"]'


logging.basicConfig(stream=sys.stderr, level=logging.INFO)


def close_cookies_modal(wait):
    """Funcion para cerrar modal de las cookies"""
    try:
        reject_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, DECLINE_COOKIES)))
        reject_btn.click()
        logging.info("✅ Cookies rechazadas")
    except (TimeoutException, NoSuchElementException):
        logging.warning("ℹ️ No se mostró el modal de cookies")


def search_page(keyword, driver, wait):
    """ESPERAR INPUT Y ESCRIBIR PALABRA"""
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SEARCH_INPUT)))
    search_input = driver.find_element(By.CSS_SELECTOR, SEARCH_INPUT)
    search_input.clear()
    search_input.send_keys(keyword)
    # time.sleep(DEFAULT_WAIT)
    search_input.send_keys(Keys.ENTER)


def normalize_domain(domain):
    """Limpia dominio para comparación"""
    if domain.startswith("http://"):
        domain = domain.replace("http://", "")
    if domain.startswith("https://"):
        domain = domain.replace("https://", "")
    if domain.startswith("www."):
        domain = domain.replace("www.", "")
    if domain.endswith("/"):
        domain = domain[:-1]
    return domain


def find_urls(domains, competitor_domains, driver, wait):
    """Extrae URLs del DOM y clasifica si son del cliente o competidor"""
    client_urls = []
    competitors_urls = []
    position = 0
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, URLS_ELEMENTS)))
    elements = driver.find_elements(By.CSS_SELECTOR, URLS_ELEMENTS)
    logging.info("🧪 Total elementos encontrados: %s", len(elements))

    for element in elements:
        try:
            # Ignorar si está dentro del acordeón
            if len(element.find_elements(By.CSS_SELECTOR, ACCORDION_EXPANDER)) > 0:
                continue

            link_elements = element.find_elements(
                By.CSS_SELECTOR, LINK_ELEMENT)
            if not link_elements:
                continue

            link_el = link_elements[0]
            url = link_el.get_attribute("href")

            if not url:
                continue

            position += 1
            element_html = element.get_attribute("innerHTML")
            element_html += NUMBER_POSITION.replace(
                POSITION_VAR, str(position))

            # Normalizamos domains
            url_normalized = normalize_domain(url)
            logging.info("🔗 URL encontrada: %s", url_normalized)

            # Buscar en domains del cliente
            client_match = next(
                (dom for dom in domains if normalize_domain(
                    dom["valor"]) in url_normalized),
                None
            )

            if client_match:
                client_urls.append({
                    "posicion": position,
                    "url": url,
                    "dominio": {
                        "id": client_match["id"],
                        "url": client_match["valor"]
                    }
                })
                element_html += CLIENT_URL_FOUND

            # Buscar en competitor_domains
            competitor_match = next(
                (dom for dom in competitor_domains if normalize_domain(
                    dom["valor"]) in url_normalized),
                None
            )

            if competitor_match:
                competitors_urls.append({
                    "posicion": position,
                    "url": url,
                    "dominio": {
                        "id": competitor_match["id"],
                        "url": competitor_match["valor"]
                    }
                })
                element_html += COMPETITOR_URL_FOUND

            driver.execute_script(
                "arguments[0].style.position = 'relative';", element)
            driver.execute_script(
                "arguments[0].innerHTML = arguments[1];", element, element_html)

        except Exception as e:
            logging.warning("⚠️ Error procesando un elemento: %s", e)
            continue

    return client_urls, competitors_urls


def check_internet_connection():
    """Verifica si hay conexión a internet usando requests"""
    try:
        # Hacemos una petición GET simple a un servidor confiable
        response = requests.get("https://www.google.com/", timeout=10)
        return response.status_code == 200
    except requests.RequestException:
        return False

def banned(wait, timeout=2):
    """Verifica hemos sido baneados"""
    try:
        temp_wait = WebDriverWait(wait._driver, timeout)
        temp_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, CAPTCHA_INFO)))
        return True
    except Exception as e:
        logging.info("EError banned: %s", e)
        return False

def restart_rooter(driver, wait):
    """Reinicio del router"""
    try:
        driver.get("http://192.168.8.1/html/home.html")

        # Hacemos click en el boton de login
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#logout_span")))
        login_link = driver.find_element(By.CSS_SELECTOR, "#logout_span")
        login_link.click()
        time.sleep(2)

        # escribimos las credenciales
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input#username")))
        user_input = driver.find_element(By.CSS_SELECTOR, "input#username")
        user_input.clear()
        user_input.send_keys("admin")
        password_input = driver.find_element(By.CSS_SELECTOR, "input#password")
        password_input.clear()
        password_input.send_keys("12345678")
        time.sleep(2)
        # hacemos click en login
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#pop_login")))
        login_button = driver.find_element(By.CSS_SELECTOR, "#pop_login")
        login_button.click()
        time.sleep(2)

        # Nos vamos a la pagina de reboot
        driver.get('http://192.168.8.1/html/reboot.html')
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#reboot_apply_button")))
        reboot_button = driver.find_element(By.CSS_SELECTOR, "#reboot_apply_button")
        reboot_button.click()

        # confirmamos el reboot
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#pop_confirm")))
        confirm_reboot_button = driver.find_element(By.CSS_SELECTOR, "#pop_confirm")
        confirm_reboot_button.click()
        time.sleep(10)
        driver.quit()

        # Verificación de conexión a internet
        attempts = 0
        max_attempts = 20

        while attempts < max_attempts:
            if check_internet_connection():
                logging.info("Internet restablecido después de %s intentos", attempts + 1)
                return True
            
            logging.info("Intento %s/%s Sin conexión, esperando...", attempts + 1, max_attempts)
            time.sleep(2)
            attempts += 1

        # Si llegamos aquí, no se restableció la conexión
        logging.info("No se pudo restablecer la conexión después de %s intentos", max_attempts)
        
        return False
    except Exception as e:
        logging.info("Error en reinicio directo: %s", e)
        return False


def run(check_banned=True):
    """Funcion encargada de arrancar el scraping"""
    logging.info("Run: %s", check_banned)
    
    system = platform.system()
    chrome_path = ""
    if system == "Darwin":  # macOS
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    elif system == "Windows":
        chrome_path = "C:\\Program Files\\Google\\Chrome\\chrome.exe"
    
    if chrome_path:
        logging.info("Chrome encontrado en: %s", chrome_path)
    else:
        logging.warning("No se encontró Chrome, usando configuración por defecto")
        chrome_path = None
        
    options = uc.ChromeOptions()
    options.binary_location = chrome_path  # 👈 forzamos el path
    driver = uc.Chrome(
        options=options,
        headless=False,
        use_subprocess=True if system == "Darwin" else False,
    )
    wait = WebDriverWait(driver, DEFAULT_TIME_OUT)

    input_json = sys.argv[1]
    data = json.loads(input_json)
    # Ahora accedés a las variables así:
    keyword = data.get("keyword")
    domains = data.get("domains", [])
    competitor_domains = data.get("competitorDomains", [])

    try:
        driver.get(URL)
        # time.sleep(DEFAULT_WAIT)
        close_cookies_modal(wait)
        # time.sleep(DEFAULT_WAIT)
        search_page(keyword, driver, wait)
        # time.sleep(DEFAULT_WAIT)
        
        if check_banned:
            is_banned = banned(wait)
            logging.info("is_banned: %s", is_banned)
            if is_banned:
                restart_success = restart_rooter(driver, wait)
                if restart_success:
                    return run(check_banned=False)
                else:
                    raise Exception("No se pudo reiniciar el router")

        client_urls, competitors_urls = find_urls(domains, competitor_domains, driver, wait)
        result = {
            "clientUrls": client_urls,
            "competitorsUrls": competitors_urls,
            "ok": True
        }
        driver.quit()
        print(json.dumps(result))

    except Exception as e:
        logging.warning("❌ Error: %s", e)
        result = {
            "ok": False
        }
        driver.quit()
        print(json.dumps(result))


run()


# python3 ./src/python/search_google.py '{"keyword":"agencia seo madrid","domains":[{"id":"-LlH6O10k81KNJSIgOg5","status":"activo","valor":"sedigital.es"}, {"id":"-LlH6O10k81KNJSIgOg5","status":"activo","valor":"agenciaseo.eu"}],"competitorDomains":[{"id":"-LlH6O10k81KNJSIgOg5","status":"activo","valor":"jrizo.com"}, {"id":"-LlH6O10k81KNJSIgOg5","status":"activo","valor":"idento.es/agencia-seo-madrid"}]}'
