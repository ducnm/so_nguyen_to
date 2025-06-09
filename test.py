import requests
import time

def test_prime_api(numbers):
    base_url = "http://localhost:3000/check-prime"
    
    for number in numbers:
        try:
            start_time = time.time()
            
            # Gọi API
            response = requests.get(f"{base_url}?number={number}")
            response_time = (time.time() - start_time) * 1000  # tính bằng ms
            
            # Parse JSON response
            data = response.json()
            
            # Kiểm tra kết quả
            if response.status_code == 200:
                print(f"Number: {number}")
                print(f"Is Prime: {data['isPrime']}")
                print(f"Response Time: {response_time:.2f}ms")
            else:
                print(f"Error for {number}: {data.get('error', 'Unknown error')}")
            
            print("-" * 50)
            
        except ValueError:
            print(f"Invalid response format for {number}")
            print("-" * 50)
        except Exception as e:
            print(f"Error checking number {number}: {str(e)}")
            print("-" * 50)

# Danh sách các số cần kiểm tra
test_numbers = [
    2, 3, 4, 5, 7, 11, 13, 15, 17, 20, 
    23, 29, 31, 37, 41, 43, 47, -7, 0, 1, 
    "abc", 99999999999999997, 1000000000000000003
]

test_prime_api(test_numbers)