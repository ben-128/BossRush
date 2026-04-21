Shader "Custom/SpriteSilhouette"
{
    Properties
    {
        _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Silhouette Color", Color) = (0.1, 0.05, 0.02, 1)
        _AlphaCutoff ("Alpha Cutoff", Range(0, 1)) = 0.01
        _Expand ("Mesh Expand (world units)", Float) = 0.0
        _DilatePixels ("Dilate Radius (pixels)", Range(0, 32)) = 3
        _FalloffTex ("Alpha Falloff Curve (1D)", 2D) = "white" {}
        _FalloffStrength ("Falloff Strength", Range(0, 1)) = 0
        _UVCenter ("UV Center (atlas)", Vector) = (0.5, 0.5, 0, 0)
        _UVHalfExtent ("UV Half Extent (atlas)", Vector) = (0.5, 0.5, 0, 0)
    }
    SubShader
    {
        Tags
        {
            "Queue" = "Transparent"
            "RenderType" = "Transparent"
            "IgnoreProjector" = "True"
            "PreviewType" = "Plane"
            "CanUseSpriteAtlas" = "True"
        }

        Cull Off
        Lighting Off
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 3.0
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4 _MainTex_TexelSize;
            fixed4 _Color;
            float _AlphaCutoff;
            float _Expand;
            float _DilatePixels;
            sampler2D _FalloffTex;
            float _FalloffStrength;
            float4 _UVCenter;
            float4 _UVHalfExtent;

            v2f vert(appdata v)
            {
                v2f o;
                // Push per-axis (pas radial) → le quad grossit de _Expand unités dans CHAQUE direction,
                // indépendamment de la forme du sprite. Sans ça, un sprite vertical reçoit surtout
                // du push en Y et peu en X, ce qui clippe la dilatation sur les côtés.
                float2 axisSign = sign(v.uv - _UVCenter.xy);
                float4 expanded = v.vertex;
                expanded.xy += axisSign * _Expand;

                o.pos = UnityObjectToClipPos(expanded);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            // Échantillonne la silhouette BINAIRE du sprite (0 ou 1) :
            // on ignore l'AA natif du PNG pour que le falloff du drop shadow vienne UNIQUEMENT
            // du kernel Gaussian — sinon les bords avec AA du sprite (diagonales/courbes)
            // reçoivent un falloff doublé par rapport aux bords rectilignes sans AA.
            float SampleSpriteAlpha(float2 uv)
            {
                float2 uvMin = _UVCenter.xy - _UVHalfExtent.xy;
                float2 uvMax = _UVCenter.xy + _UVHalfExtent.xy;
                float inside = step(uvMin.x, uv.x) * step(uv.x, uvMax.x)
                             * step(uvMin.y, uv.y) * step(uv.y, uvMax.y);
                float rawAlpha = tex2D(_MainTex, uv).a * inside;
                // Binarisation : seuil 0.5 → silhouette pure, indépendante de l'AA source
                return step(0.5, rawAlpha);
            }

            fixed4 frag(v2f i) : SV_Target
            {
                // Blur Gaussian 7×7 (49 samples) échantillonné en PIXELS ÉCRAN
                // via ddx/ddy(uv) pour un falloff uniforme à l'écran,
                // indépendamment du scale ou de l'aspect du sprite (vertical, horizontal, stretché).
                //
                // ddx(uv)/ddy(uv) = dérivées UV par pixel écran → 1 pixel écran en X = ddx_uv en UV.
                // Le kernel spans ±_DilatePixels pixels ÉCRAN total, en step = _DilatePixels/3.
                float2 duvdx = ddx(i.uv);
                float2 duvdy = ddy(i.uv);
                float stepScreenPx = _DilatePixels / 3.0;
                float sigma = max(_DilatePixels * 0.5, 0.5);
                float twoSigmaSq = 2.0 * sigma * sigma;

                float alphaSum = 0.0;
                float weightSum = 0.0;

                [unroll]
                for (int y = -3; y <= 3; y++)
                {
                    [unroll]
                    for (int x = -3; x <= 3; x++)
                    {
                        float d2 = float(x * x + y * y);
                        float w = exp(-d2 / twoSigmaSq);
                        // Offset = x pixels écran en X + y pixels écran en Y, converti en UV
                        float2 uvOffset = duvdx * (x * stepScreenPx) + duvdy * (y * stepScreenPx);
                        float2 uv = i.uv + uvOffset;
                        alphaSum += SampleSpriteAlpha(uv) * w;
                        weightSum += w;
                    }
                }

                float a = alphaSum / weightSum;

                clip(a - _AlphaCutoff);

                fixed4 col = _Color;
                col.a *= a; // falloff soft uniforme tous côtés, indépendant du sprite source

                // Distance Chebyshev (max par axe) normalisée par les bounds du contenu alpha.
                // → dist = 0 au centre, 1 aux bords réels du dessin.
                float2 extent = max(_UVHalfExtent.xy, 0.0001);
                float2 localUV = abs(i.uv - _UVCenter.xy) / extent;
                float chebyshevDist = saturate(max(localUV.x, localUV.y));

                // Radial alpha falloff OPTIONNELLE (modulation selon la curve de l'user).
                if (_FalloffStrength > 0.001)
                {
                    float falloff = tex2D(_FalloffTex, float2(chebyshevDist, 0.5)).r;
                    col.a *= lerp(1.0, falloff, _FalloffStrength);
                }

                // EDGE FADE GARANTI : force alpha = 0 aux bords du contenu,
                // indépendamment de la curve ou du strength.
                // Courbe "ease-out" pour un bord doux (plus smooth qu'un lerp linéaire).
                float edgeFade = 1.0 - chebyshevDist;
                edgeFade = edgeFade * edgeFade * (3.0 - 2.0 * edgeFade); // smoothstep-like
                col.a *= edgeFade;

                return col;
            }
            ENDCG
        }
    }
}
