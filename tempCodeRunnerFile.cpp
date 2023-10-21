#include<iostream>
#include<vector>
using namespace std;

void reverseWord(string& s, int initialIndex, int lastIndex){
    for(int i = initialIndex, j = lastIndex; i < j; i++, j--){
        char temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }
    cout << initialIndex << ' ' << lastIndex << " " << s << endl;
}
string reverseWords(string s) {
    vector<string> v = getline(s,t,' ') 

}
int main(){
    reverseWords("what is this");
}