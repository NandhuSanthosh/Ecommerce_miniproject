#include <iostream>
#include <vector>
using namespace std;

void printMatrix(vector<vector<int>>& receiver){
    for(int i = 0; i<receiver.size(); i++){
        for(int j = 0; j<receiver[0].size(); j++){
            cout << recevier[i][j] << " " ;
        }
        cout<< endl;
    }
    cout << endl;
}

long long getMaxFunctionValue(vector<int>& receiver, long long k) {
        long long int max = 0;
        
    
        vector<vector<int>> matrix(receiver.size(), vector<int>(k, 0));
        
        for(int i =0; i<receiver.size(); i++){
            int sum = i;
            int curr = i;
            for(int j = 0; j<k; j++){
                if(matrix[curr][j] <= sum){
                    break;
                }
                else{
                    matrix[curr][j] = sum;
                }
                sum += receiver[curr];
                curr = receiver[curr];
                printMatrix(receiver);
            }
            if(sum > max) max = sum;
        }
        
        return max;
    }

int main(){
    long long k = 6;
    vector<int> receiver = {2, 0, 1};
    cout << getMaxFunctionValue(receiver, k);
}