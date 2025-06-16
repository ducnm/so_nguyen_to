import requests

def get_weather_data(location: str) -> str:
    api_key = "7683708b48e1b4ca66a1a90aad6eac3ec"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric&lang=vi"
    response = requests.get(url)
    data = response.json()

    if data.get("cod") != 200:
        return f"Không tìm thấy thông tin thời tiết cho {location}."

    weather = data["weather"][0]["description"]
    temp = data["main"]["temp"]
    humidity = data["main"]["humidity"]
    return f"Thời tiết tại {location}: {weather}, {temp}°C, độ ẩm {humidity}%."
