# Third-party sample data

`examples/plans/microsoft-compare1-fast.sqlplan` and `examples/plans/microsoft-compare1-slow.sqlplan` originate from [Microsoft SQL Server Samples](https://github.com/microsoft/sql-server-samples/tree/26dc1258b431470f515775b8c98ae77e1d66e39a/samples/demos/Plan-Comparison/Offline), source commit `26dc1258b431470f515775b8c98ae77e1d66e39a`. Original blob SHAs: fast `8424613fc80597c7c9f13f635f0c9af380de203c`, slow `bdd4b9679a8761a1253facfc100ddd0211aa4307`. The files were decoded to UTF-8, XML declarations updated accordingly and line endings normalized. They are real execution plans from Microsoft's Plan Comparison demo, not invented plans or SQL Atlas measurements. Their `QueryHash` values differ, so their costs cannot establish a speedup for an identical query.

Microsoft SQL Server Sample Code, Copyright (c) Microsoft Corporation. Licensed under the MIT License in the [source repository](https://github.com/microsoft/sql-server-samples/blob/master/license.txt). Permission is granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense and/or sell copies, subject to including the copyright and permission notice. The software is provided “AS IS”, without warranty of any kind, express or implied, including merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability arising from the software or its use.

The full source license notice is reproduced below:

```text
Microsoft SQL Server Sample Code

Copyright (c) Microsoft Corporation

All rights reserved.

MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
```
